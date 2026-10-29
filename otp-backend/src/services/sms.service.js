
async function sendSMS(phone, otp) {
  const response = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: process.env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      recipients: [
        {
          mobiles: phone.replace("+", ""),
          VAR1: otp,
          VAR2: "2",
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok || data.type === "error") {
    throw new Error(data.message || "MSG91 SMS request failed");
  }

  return data;
}

module.exports = { sendSMS };
