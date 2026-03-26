async function test() {
  try {
    const r = await fetch('http://localhost:3000/internal-admin-api');
    console.log(await r.text());
  } catch (e) {
    console.log(e.message);
  }
}
test();
