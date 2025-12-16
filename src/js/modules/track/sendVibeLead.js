const sendVibeLead = () => {
  try {
    vbpx("event", "lead");
  } catch (err) {
    console.warn("failed vibe\n", err);
  }
};

export default sendVibeLead;
