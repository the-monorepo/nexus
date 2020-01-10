  export const wrap = (text, cols) => {
  const lines = [];

  while (text.length > cols) {
    let end = text.lastIndexOf(" ", cols);
    if(end === -1) {
      end = cols;
    }

    const line = text.slice(0, end);
    text = text.slice(end);
    lines.push(line);
  }

  return lines;
};

/*
export const wrap = (text, cols) => {
  const lines = [];

  while (text.length > cols) {
    let end = text.lastIndexOf(" ", cols);
    if(end === -1) {
      end = cols;
    }

    const line = text.slice(0, end);
    text = text.slice(end);
    lines.push(line);
  }
  lines.push(text);

  return lines;
};
*/
