import { task } from "@trigger.dev/sdk/v3";
import { sql } from "../lib/db";

// Curated list of high-quality professional corporate portraits from Unsplash
const malePhotos = [
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1500648767791-00dcc994a43e",
  "photo-1472099645785-5658abf4ff4e",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1539571696357-5a69c17a67c6",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1560250097-0b93528c311a"
];

const femalePhotos = [
  "photo-1494790108377-be9c29b29330",
  "photo-1534528741775-53994a69daeb",
  "photo-1544005313-94ddf0286df2",
  "photo-1517841905240-472988babdf9",
  "photo-1438761681033-6461ffad8d80",
  "photo-1573496359142-b8d87734a5a2",
  "photo-1580489944761-15a19d654956"
];

const otherPhotos = [
  "photo-1531746020798-e6953c6e8e04",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1554151228-14d9def656e4",
  "photo-1548142813-c348350df52b"
];

function hashCode(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export async function runGeneratePersonaImage(personaId) {
  console.log(`[Image Generator]: Loading persona ${personaId}...`);
  const data = await sql("SELECT * FROM personas WHERE id = $1", [personaId]);
  if (data.length === 0) {
    throw new Error(`Persona not found: ${personaId}`);
  }

  const persona = data[0];
  const name = persona.name || "User";
  const gender = (persona.gender || "Male").toLowerCase();
  
  console.log(`[Image Generator]: Generating avatar for ${name} (${gender})...`);
  
  let photoId = "";
  const seedString = personaId + "-" + name;
  const hash = Math.abs(hashCode(seedString));
  
  if (gender === "male") {
    photoId = malePhotos[hash % malePhotos.length];
  } else if (gender === "female") {
    photoId = femalePhotos[hash % femalePhotos.length];
  } else {
    photoId = otherPhotos[hash % otherPhotos.length];
  }

  const generatedUrl = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=256&h=256&q=80`;
  
  console.log(`[Image Generator]: Generated URL: ${generatedUrl}. Saving to database...`);
  
  await sql("UPDATE personas SET image_url = $1 WHERE id = $2", [generatedUrl, personaId]);
  
  return {
    success: true,
    personaId,
    name,
    imageUrl: generatedUrl
  };
}

export const generatePersonaImageTask = task({
  id: "generate-persona-image",
  maxDuration: 120, // 2 minutes timeout
  run: async (payload, { ctx }) => {
    const personaId = payload?.id;
    if (!personaId) {
      throw new Error("Payload 'id' is required.");
    }
    console.log(`[Task ${ctx.run.id}]: Running generate-persona-image for persona ${personaId}...`);
    return await runGeneratePersonaImage(personaId);
  }
});
