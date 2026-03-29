const command = 'echo "" "foo" \'bar baz\' \\ space';
const parts =
  command.match(/(?:[^\s"'\\]|\\.|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')+/g) ||
  [];
console.log(parts);
const parsedArgs = parts.map((arg) => {
  return arg.replace(
    /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|\\(.)/g,
    (match, dq, sq, esc) => {
      if (dq) return dq.slice(1, -1).replace(/\\(.)/g, "$1");
      if (sq) return sq.slice(1, -1).replace(/\\(.)/g, "$1");
      if (esc) return esc;
      return match;
    },
  );
});
console.log(parsedArgs);

const command2 = 'node -e "console.log(\\"test\\")"';
const parts2 =
  command2.match(/(?:[^\s"'\\]|\\.|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')+/g) ||
  [];
console.log(parts2);
const parsedArgs2 = parts2.map((arg) => {
  return arg.replace(
    /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|\\(.)/g,
    (match, dq, sq, esc) => {
      if (dq) return dq.slice(1, -1).replace(/\\(.)/g, "$1");
      if (sq) return sq.slice(1, -1).replace(/\\(.)/g, "$1");
      if (esc) return esc;
      return match;
    },
  );
});
console.log(parsedArgs2);
