const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash for "admin":', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare('admin', hash);
  console.log('Hash validation test:', isValid);
}

generateHash().catch(console.error);
