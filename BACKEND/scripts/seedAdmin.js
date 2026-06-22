require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../src/models/user.model')

async function seedAdmin() {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('MONGO_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required')
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters')
  await mongoose.connect(MONGO_URI)
  const email = ADMIN_EMAIL.toLowerCase()
  const existing = await User.findOne({ email })
  if (existing) {
    existing.name = ADMIN_NAME || existing.name || 'System Administrator'
    existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    existing.role = 'admin'
    existing.isActive = true
    existing.division = undefined
    await existing.save()
    console.log(`Admin reset: ${email}`)
  } else {
    await User.create({ name: ADMIN_NAME || 'System Administrator', email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10), role: 'admin' })
    console.log(`Admin created: ${email}`)
  }
  await mongoose.disconnect()
}

seedAdmin().catch((error) => { console.error(error.message); process.exit(1) })
