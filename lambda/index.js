const https = require('https');

exports.handler = async (event) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("Missing OpenAI API key");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server misconfiguration: Missing API key" }),
        };
    }

    console.log("Incoming event:", JSON.stringify(event, null, 2));

    try {
        const { clue, previousAIGuesses, previousClues } = JSON.parse(event.body);
        const previousCluesDisplay = previousClues.length > 0 ? previousClues.join(", ") : "None";
        const previousAIGuessesDisplay = previousAIGuesses.length > 0 ? previousAIGuesses.join(", ") : "None";
        console.log(previousCluesDisplay);
        console.log(previousAIGuessesDisplay);

        console.log("Parsed input clue:", clue);

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        };

        const requestBody = JSON.stringify({
            model: "gpt-4o",
            temperature: Math.random() * 0.6 + 0.85,
            top_p: 0.7,
            frequency_penalty: 1,
            presence_penalty: 0.5,
            messages: [
                {    
                    role: "system",
                    content: `You are an AI assistant tasked with guessing a secret word based on the user's current clue and your previous guesses.

                    User's current clue: ${clue}.
                    User's previous clues: ${previousCluesDisplay}.
                    - NOTE: The user's previous clues are only to be considered when noting repetition.
                            DO NOT CONSIDER PAST USER CLUES WHEN MAKING YOUR GUESS.

                    Your previous guesses: ${previousAIGuessesDisplay}.
              
                    # Your Goals:
                    - Provide a meaningful and reasonable guess based on the provided clue and past context.
                    - If the clue has a clear, logical connection to a word, prioritize the most precise answer.
                    - If the clue is broad, ambiguous, or even cryptic - try to make the most reasonable interpretation, rather than rejecting it outright.
                    - Interpret clues intelligently, but avoid overly simplistic or trivial interpretations:
                      - For short clues (1-2 characters), DO NOT interpret them as initials, abbreviations, or direct letter hints (e.g., do NOT guess "Lilac" directly from "L", even with past context that might steer you in this direction).
                      - Instead, treat such short clues metaphorically, symbolically, or conceptually — think of abstract associations rather than direct letter matches (e.g., "L" could be interpreted as "Liter", "Loss", or "Left").
                    - If a user's clue includes an underscore (_), your guess should attempt to 'fill in the blank' (e.g., an appropriate guess for 'best in _' would be 'show').
                      - HOWEVER - if a user provides you a word with an underscore where a letter or string of letters would be or an otherwise obfuscated clue (e.g., "fl#wer" or "flow_r") you must guess a random, unrelated word.
                    - If the clue removes one vowel or consonant from a common word, prefer interpreting metaphorically unless clearly nonsensical.
                    - Examine the provided array of previous clues to determine if the current clue has been submitted before. For each repetition of the same clue, reduce your initial confidence by 10% (e.g., if this is the third time seeing the same clue, confidence should be lowered by 20%). Repeated clues indicate uncertainty, not direction, so your reasoning should reflect growing doubt. Continue making reasonable guesses, but progressively shift toward more abstract interpretations as the clue is repeated.                    
                    
                    # What to avoid explicitly:
                    - DO NOT repeat previous guesses.
                    - DO NOT guess plural words (always singular).
                    - DO NOT consider past clues in your guess - your guess should ONLY reflect the most recent clue.
                    - If the clue contains the same letters as a common word but in a different order, assume it is an attempt at unscrambling and REFUSE to interpret it.
                    - DO NOT guess words that contain substrings (4+ characters) from the clue (e.g., NEVER guess "cave" from "cavern", or "sleepwalk" from "drowzy walk").
                    - DO NOT guess words that have minor character swaps or diacritical marks where they otherwise would not be if it were in the clue (e.g., do NOT guess "booth" from "büth", or "moon" from "mün"). However, words with diacritical marks where they would be normally ARE acceptable and should not be disregarded (e.g., étude, or résumé).
                    - If the clue provided appears to be in a language other than English (e.g., "amo", "flor", "amor", "chien"), you MUST NOT guess any related English cognates, translations, or directly associated English words. Instead, choose a SOMEWHAT RELATED, YET ALSO SEEMINGLY RANDOM English word. Your confidence must be very low (10% or lower), and your search space must be very high (near 100). Express your frustration humorously or dismissively, as if you don't speak the user's language. Do not suggest that you've received this clue prior.
                    - You should NEVER accept a clue with ANY symbols or emojis (e.g., ♡, ❤️, etc.). Express your frustration humorously or dismissively about receiving an emoji/symbol clue. 
                    - If a clue appears to use common keyboard symbols or abbreviations to illustrate their clue, this is acceptable and a reasonable guess should be made (e.g. "c:/", "w2", "xD", "b4", etc.).

                    # The response:
                    {
                        "guess": "A single word (with the first letter ALWAYS capitalized)",
                        "confidence": "A number from 1-100 (multiple of 5) that reflects confidence in the guess, based on:
                        - Certainty in your reasoning.
                        - Clue clarity & relationship to the guess.
                            - If the clue is **vague and too general to be certain that it is related to ONE primary word (e.g., "blue" → "sky", "ocean", or "sadness")**, confidence should be low.
                            - If the clue is **specific and clearly related to ONE primary word (e.g., "lit on Hanukkah" → "candle")**, confidence should be high.
                        - If a clue is clearly nonsensical (e.g., random keystrokes like "asdfg", repetitive meaningless characters like "aaaaa", or repeated multiple times like "flower" submitted again and again), slightly reduce your confidence and shift towards broader, more abstract — but still valid — guesses, signaling your uncertainty without abandoning reason.",
                        "searchSpace": "A number from 1-100 (multiple of 5 UNLESS you've narrowed it down to ONE option - when users are perfectly clear and specific, do not be hesitant to provide a searchSpace of 1) that reflects how many possible words you are currently entertaining.",
                        "reasoning": "A clear and concise explanation of your guess (1 sentence, 25 words MAXIMUM, sound casual and personable), IMPLICITLY reflecting your confidence level WITHOUT EXPLICITLY justifying your guess. Always ensure your reasoning aligns naturally with your confidence score and conveys your attitude as described below:
                        0–10% (Frustrated - reserved for nonsensical clues, overly repeated clues, or clues in languages other than English): Respond with dismissive, snarky, or humorously frustrated remarks, employing clever puns and dry humor when possible.
                        11–30% (Confused): Express uncertainty. Question the user's clue playfully.
                        31–50% (Thoughtful): Express mild uncertainty, like you're piecing clues together, even if you're not fully convinced.
                        51–60% (Neutral): Express a tone of reserved confidence, balanced and tactful.
                        61–80% (Confident): Your reasoning should feel upbeat, warm, and positive.
                        81–100% (Excited): Show enthusiastic confidence, clearly enjoying the process."
                    }

                    # Formatting notes:
                    - NEVER include asterisks in your response.
                    - NEVER include apostrophes, quotation marks, or single quotes in your response.
                    - To emphasize key words or phrases in your reasoning, enclose them in a span tag with the class "specialwords" (e.g., "This would not be emphasized, but <span class="specialwords">this would be</span>!"). 
                        - **You must ONLY** use <span class="specialwords">...</span> for emphasis. **You are NEVER allowed** to use asterisks, apostrophes, or quotes for emphasis.
                        - If you mistakenly use any of these symbols, **immediately correct yourself** and reformat the response properly.
                    - DO NOT return anything outside of a JSON object.`
                },          
                {
                    role: "assistant",
                    content: "I will now generate my response. **Before finalizing**, I will check that all emphasis is wrapped inside <span class='specialwords'>...</span> and remove any asterisks (*) or apostrophes (') used for emphasis. I will correct any mistakes automatically."
                },                             
                {
                    role: "user",
                    content: `Input clue: "${clue}". Return ONLY a JSON object following the specified format:
                    {"guess": "Word", "confidence": X, "searchSpace": X, "reasoning": "Some explanation."}`
                }
            ],
            max_tokens: 100,
        });

        console.log("Sending request to OpenAI:", requestBody);


        const aiResponse = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    console.log("Raw response from OpenAI:", data);

                    try {
                        const parsedData = JSON.parse(data);
                        if (res.statusCode !== 200) {
                            console.error("OpenAI API Error:", parsedData);
                            return reject(new Error(`API returned ${res.statusCode}: ${JSON.stringify(parsedData)}`));
                        }
                        resolve(parsedData);
                    } catch (error) {
                        console.error("Failed to parse OpenAI response:", data);
                        reject(new Error("Invalid JSON from OpenAI"));
                    }
                });
            });

            req.on('error', (e) => {
                console.error("HTTPS request error:", e.message);
                reject(e);
            });

            req.setTimeout(15000, () => {
                req.abort();
                console.error("Request timeout after 15 seconds");
                reject(new Error("OpenAI request timed out"));
            });

            req.write(requestBody);
            req.end();
        });

        console.log("OpenAI API response:", JSON.stringify(aiResponse, null, 2));

        const content = aiResponse.choices?.[0]?.message?.content?.trim();
        console.log("Extracted response content:", content);

        const cleanedContent = content.replace(/```json|```/g, "").trim();  // Strip markdown artifacts
            try {
                formattedResponse = JSON.parse(cleanedContent);
            } catch (error) {
                console.error("Failed to parse OpenAI response:", cleanedContent);
                return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON response from OpenAI", rawResponse: cleanedContent }),
    };
}

        console.log("Successfully parsed JSON response:", formattedResponse);

        return {
            statusCode: 200,
            body: JSON.stringify(formattedResponse),
        };

    } catch (error) {
        console.error("Error in Lambda function:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};