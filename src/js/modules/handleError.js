const handleError = () => {
  document.body.classList.add("error");
  setTimeout(() => {
    window.location.href = "https://buckedup.com";
  }, 3000);
};

export default handleError;
