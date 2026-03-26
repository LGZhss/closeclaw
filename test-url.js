try {
  const parsed = new URL('file:///etc/passwd');
  console.log(parsed.protocol);
} catch (e) {
  console.log(e.message);
}
