
async function sendSMS(phone, otp) {
  console.log("1. sendSMS() function called");

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    throw new Error(
      "MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is missing in .env"
    );
  }

  const payload = {
    template_id: templateId,
    recipients: [
      {
        mobiles: phone.replace("+", ""),
        VAR1: String(otp),
        VAR2: "2",
      },
    ],
  };

  console.log("2. Sending request to MSG91 Flow API...");
  console.log("3. Template ID configured:", Boolean(templateId));

  let response;

  try {
    response = await fetch(
      "https://control.msg91.com/api/v5/flow",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    console.error("MSG91 network request failed:", error.message);
    throw new Error("Could not connect to MSG91");
  }

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { message: "MSG91 returned a non-JSON response" };
  }

  console.log("4. MSG91 HTTP status:", response.status);
  console.log("5. MSG91 response:", JSON.stringify(data));

  if (!response.ok || data.type === "error") {
    throw new Error(
      data.message || "MSG91 SMS request failed"
    );
  }

  console.log("6. MSG91 request accepted.");
  return data;
}

module.exports = { sendSMS };
