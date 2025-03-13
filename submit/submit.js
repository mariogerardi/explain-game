import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON format" }) };
    }

    const { player_id, username, score } = body;

    if (!player_id || !username || typeof score !== "number") {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields" }) };
    }

    console.log("Received event body:", JSON.stringify(body, null, 2));

    // Query DynamoDB to check if this player has an existing score
    const paramsQuery = {
        TableName: "Leaderboard",
        KeyConditionExpression: "player_id = :player_id",
        ExpressionAttributeValues: {
            ":player_id": { S: player_id }
        }
    };

    try {
        const existingScores = await client.send(new QueryCommand(paramsQuery));
        console.log("Existing scores found:", JSON.stringify(existingScores, null, 2));

        let highestScore = null;
        let highestScoreItem = null;

        if (existingScores.Items && existingScores.Items.length > 0) {
            highestScoreItem = existingScores.Items.reduce((best, item) => 
                (!best || parseInt(item.score.N, 10) < parseInt(best.score.N, 10)) ? item : best, null);
            
            highestScore = parseInt(highestScoreItem.score.N, 10);
            console.log("Current best score:", highestScore);
        }

        // Only update if the new score is better (lower is better)
        if (highestScore !== null && score >= highestScore) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Score not updated (lower is better in this game)" }),
            };
        }

        // ✅ Delete the previous best score before inserting a new one
        if (highestScoreItem) {
            const deleteParams = {
                TableName: "Leaderboard",
                Key: {
                    "player_id": { S: player_id },  // partition key
                    "score": { N: highestScoreItem.score.N }  // sort key
                }
            };            

            await client.send(new DeleteItemCommand(deleteParams));
            console.log("Previous best score deleted");
        }

        // ✅ Insert the new best score
        const paramsPut = {
            TableName: "Leaderboard",
            Item: {
                player_id: { S: player_id },
                username: { S: username },
                score: { N: score.toString() },
                clue: { S: body.clue || "Unknown" },
                timestamp: { N: Date.now().toString() }
            }
        };

        await client.send(new PutItemCommand(paramsPut));
        console.log("Score successfully updated in DynamoDB");

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: "Score submitted successfully!" }),
        };

    } catch (error) {
        console.error("❌ DynamoDB Error:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};