const bcrypt = require('bcrypt');

const users = [
  {id: 1, email: 'juan@test.com', pass: 'juan123'},
  {id: 2, email: 'ana@test.com', pass: 'ana123'},
  {id: 3, email: 'carlos@test.com', pass: 'carlos123'},
  {id: 4, email: 'laura@test.com', pass: 'laura123'},
  {id: 5, email: 'miguel@test.com', pass: 'miguel123'},
  {id: 6, email: 'sofia@test.com', pass: 'sofia123'},
  {id: 7, email: 'pedro@test.com', pass: 'pedro123'},
  {id: 8, email: 'lucia@test.com', pass: 'lucia123'},
  {id: 9, email: 'jose@test.com', pass: 'jose123'},
  {id: 10, email: 'carolina@test.com', pass: 'carolina123'}
];

async function gen() {
  for(const u of users) {
    const hash = await bcrypt.hash(u.pass, 10);
    console.log(`${u.id}|${u.email}|${u.pass}|${hash}`);
  }
}
gen();
