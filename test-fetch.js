async function test() {
  try {
    const r = await fetch('file:///etc/passwd');
    console.log(await r.text());
  } catch (e) {
    console.log(e.message);
  }
}
test();
