const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

// Create a new DynamoDB client
const client = new DynamoDBClient({ region: "us-east-1" });

/* Fetches the leaderboard entries from the DynamoDB table. */

async function getLeaderboard(player_id) {
    const params = { TableName: "Leaderboard" };
    const data = await client.send(new ScanCommand(params));

    const leaderboard = data.Items.map(item => ({
        player_id: item.player_id.S,
        username: item.username.S,
        score: parseInt(item.score.N, 10),
        clue: item.clue ? item.clue.S : "???"
    }));

    leaderboard.sort((a, b) => a.score - b.score);

    const userEntry = leaderboard.find(entry => entry.player_id === player_id);
    const hasUserWon = userEntry !== undefined;

    const leaderboardWithHiddenClues = leaderboard.map(entry => ({
        username: entry.username,
        score: entry.score,
        clue: hasUserWon ? entry.clue : "???"
    }));

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify(leaderboardWithHiddenClues)
    };
}

/**
 * Deletes all leaderboard entries in DynamoDB to reset the leaderboard.
 */
async function resetLeaderboard() {
    try {
        const data = await client.send(new ScanCommand({ TableName: "Leaderboard" }));

        if (!data.Items || data.Items.length === 0) {
            console.log("Leaderboard is already empty. No reset needed.");
            return { statusCode: 200, body: JSON.stringify({ message: "Leaderboard already empty" }) };
        }

        const deletePromises = data.Items.map(item => {
            const key = {
                "player_id": { S: item.player_id.S },
                "score": { N: item.score.N } 
            };
        
            return client.send(new DeleteItemCommand({
                TableName: "Leaderboard",
                Key: key
            }));
        });
        

        await Promise.all(deletePromises);
        console.log("Leaderboard reset successfully!");

        return { statusCode: 200, body: JSON.stringify({ message: "Leaderboard reset successfully" }) };

    } catch (error) {
        console.error("Error resetting leaderboard:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}

/**
 * AWS Lambda Handler
 * - Fetches the leaderboard (default).
 * - Resets the leaderboard when "?action=reset" is passed in the query string.
 */
exports.handler = async (event) => {
    console.log("Incoming request:", JSON.stringify(event, null, 2));

    const player_id = event.queryStringParameters?.player_id;

    if (event.queryStringParameters && event.queryStringParameters.action === "reset") {
        const response = await resetLeaderboard();
        return {
            ...response,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        };
    }

    const response = await getLeaderboard(player_id);
    return {
        ...response,
        headers: { 
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    };
};