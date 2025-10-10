// Quick test to see what the actual error is
const url = 'http://localhost:3000/api/services?limit=5';

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Success:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  });
