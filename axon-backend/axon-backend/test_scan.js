const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/repo/scan', {
      repoUrl: 'https://github.com/expressjs/express',
      repoId: 'expressjs/express',
      userId: 'test-user'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

test();
