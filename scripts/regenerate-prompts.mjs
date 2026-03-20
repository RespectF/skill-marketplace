import 'dotenv/config';
import mysql from 'mysql2/promise';

async function clearCacheAndRegenerate() {
  // Connect to database
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'skill_marketplace',
  });

  try {
    // Step 1: Clear examplePrompts from uiConfig for all skills
    const [skills] = await connection.query('SELECT id, title, uiConfig FROM skills WHERE uiConfig IS NOT NULL');
    const skillList = skills;

    console.log(`Found ${skillList.length} skills with uiConfig\n`);

    for (const skill of skillList) {
      try {
        const cfg = JSON.parse(skill.uiConfig);
        if (cfg.examplePrompts) {
          delete cfg.examplePrompts;
          await connection.query('UPDATE skills SET uiConfig = ? WHERE id = ?', [JSON.stringify(cfg), skill.id]);
          console.log(`✓ Cleared cache for skill ${skill.id}: ${skill.title}`);
        }
      } catch (e) {
        console.log(`✗ Failed to process skill ${skill.id}: ${e.message}`);
      }
    }

    console.log('\nCache cleared. Now regenerating prompts...\n');

    // Step 2: Call API to regenerate prompts for all skills
    const skillIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 22];

    for (const skillId of skillIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/trpc/skills.getExamplePrompts?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22skillId%22%3A${skillId}%7D%7D%7D`);
        const data = await response.json();
        const prompts = data[0]?.result?.data?.json;
        if (Array.isArray(prompts)) {
          console.log(`✓ Skill ${skillId}: ${prompts.length} prompts - "${prompts.slice(0, 2).join('", "')}"`);
        } else {
          console.log(`✗ Skill ${skillId}: failed`);
        }
      } catch (err) {
        console.log(`✗ Skill ${skillId}: ${err.message}`);
      }
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\nDone!');
  } finally {
    await connection.end();
  }
}

clearCacheAndRegenerate();