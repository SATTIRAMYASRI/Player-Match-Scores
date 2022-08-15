const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("https://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const gettingAllPlayerRes = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

const gettingMatchesRes = (eachMatch) => {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
};

app.get("/players/", async (request, response) => {
  const gettingAllPlayersQuery = `SELECT * FROM player_details;`;
  const gettingAllPlayers = await database.all(gettingAllPlayersQuery);
  response.send(
    gettingAllPlayers.map((eachPlayer) => gettingAllPlayerRes(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const gettingPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const gettingPlayer = await database.get(gettingPlayerQuery);
  response.send(gettingAllPlayerRes(gettingPlayer));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const gettingMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const gettingMatch = await database.get(gettingMatchQuery);
  response.send(gettingMatchesRes(gettingMatch));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const gettingAllMatchesQuery = `SELECT * FROM player_match_score 
   NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const gettingAllMatches = await database.all(gettingAllMatchesQuery);
  response.send(
    gettingAllMatches.map((eachMatch) => gettingMatchesRes(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const gettingAllPlayersOfSpecificMatch = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const gettingAllPlayersArray = await database.all(
    gettingAllPlayersOfSpecificMatch
  );
  response.send(
    gettingAllPlayersArray.map((eachPlayer) => gettingAllPlayerRes(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const gettingStatisticsOfPlayer = `SELECT 
    player_id,
    player_name,
    SUM(score),
    SUM(fours),
    SUM(sixes),
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE 
    player_id=${playerId}
    ;`;
  const gettingStatistics = await database.get(gettingStatisticsOfPlayer);
  response.send({
    playerId: gettingStatistics["player_id"],
    playerName: gettingStatistics["player_name"],
    totalScore: gettingStatistics["SUM(score)"],
    totalFours: gettingStatistics["SUM(fours)"],
    totalSixes: gettingStatistics["SUM(sixes)"],
  });
});
module.exports = app;
