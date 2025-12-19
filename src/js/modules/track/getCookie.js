const getCookie = (name) => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const splited = cookie.split("=");
    if (splited[0].trim() == name) return decodeURIComponent(splited[1]);
  }
};

export default getCookie