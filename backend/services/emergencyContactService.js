import EmergencyContact from "../models/EmergencyContact.js";
import { defaultEmergencyContacts } from "../config/emergencyContacts.js";

export async function seedEmergencyContacts() {
  await Promise.all(defaultEmergencyContacts.map((contact) =>
    EmergencyContact.updateOne({ key: contact.key }, { $setOnInsert: contact }, { upsert: true })
  ));
}
