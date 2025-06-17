import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "",
  baseURL: "https://openai-proxy.svk77.com/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "5 Line AI HAiku" }],
    model: "gpt-4.1",
  });

  console.log(completion.choices[0].message.content);
}

main();
