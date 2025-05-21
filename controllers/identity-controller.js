
import pool from '../db/db.js';

export const identityController=async (req,res)=>{
       const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ message: 'Email or phone number is required' });
  }



  try {

    const client = await pool.connect();
    const { rows: matchingContacts } = await client.query(
      `SELECT * FROM contacts WHERE email = $1 OR phoneNumber = $2`,
      [email, phoneNumber]
    );

    let primaryContact = null;

    if (matchingContacts.length === 0) {
      const result = await client.query(
        `INSERT INTO contacts (email, phoneNumber, linkPrecedence) 
         VALUES ($1, $2, 'primary') RETURNING *`,
        [email, phoneNumber]
      );
      primaryContact = result.rows[0];

    } else {
      const primaryContacts = matchingContacts.filter(c => c.linkprecedence === 'primary');
      if (primaryContacts.length > 1) {

        primaryContacts.sort((a, b) => new Date(a.createdat) - new Date(b.createdat));

        const oldest = primaryContacts[0];
        const toConvert = primaryContacts[1];
        // for updates
        await client.query(
          `UPDATE contacts 
           SET linkPrecedence = 'secondary', linkedId = $1, updatedAt = NOW() 
           WHERE id = $2`,
          [oldest.id, toConvert.id]
        );

        // again assigning all secondaries of the converted contact to the oldest
        await client.query(
          `UPDATE contacts 
           SET linkedId = $1, updatedAt = NOW() 
           WHERE linkedId = $2`,
          [oldest.id, toConvert.id]
        );
      }

      primaryContact = matchingContacts
        .filter(c => c.linkprecedence === 'primary')
        .reduce((earliest, c) =>
          new Date(c.createdat) < new Date(earliest.createdat) ? c : earliest
        );

      for (const contact of matchingContacts) {
        if (contact.id !== primaryContact.id && contact.linkprecedence !== 'secondary') {
          await client.query(
            `UPDATE contacts 
             SET linkPrecedence = 'secondary', linkedId = $1, updatedAt = NOW() 
             WHERE id = $2`,
            [primaryContact.id, contact.id]
          );
        }
      }

      const alreadyExists = matchingContacts.some(
        c => c.email === email && c.phonenumber === phoneNumber
      );
      if (!alreadyExists) {
        await client.query(
          `INSERT INTO contacts (email, phoneNumber, linkPrecedence, linkedId) 
           VALUES ($1, $2, 'secondary', $3)`,
          [email, phoneNumber, primaryContact.id]
        );
      }
    }

    const { rows: relatedContacts } = await client.query(
      `SELECT * FROM contacts WHERE id = $1 OR linkedId = $1`,
      [primaryContact.id]
    );

    const emails = [...new Set(relatedContacts.map(c => c.email).filter(Boolean))];
    const phoneNumbers = [...new Set(relatedContacts.map(c => c.phonenumber).filter(Boolean))];
    const secondaryContactIds = relatedContacts
      .filter(c => c.linkprecedence === 'secondary')
      .map(c => c.id);

    res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });

    client.release();

  } catch (err) {
    console.error('Error in /identify:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}