const http = require("http")
const express = require("express")
const socketIo = require("socket.io")
const helmet = require('helmet')
const cors = require('cors')
const pkg = require('./package.json')
const { db, ERRORS } = require('./db')

const port = process.env.PORT || 5000
const app = express()
const httpServer = http.createServer(app)
const io = socketIo(httpServer, { origins: '*:*' })

const userSocketHandler = require('./socketHandlers/users.socket')

io.on('connection', socket => {
  userSocketHandler(socket, io, db)
})

app.use(helmet())
app.use(cors())

app.get('/', (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description
  })
})

function getGames () {
  const rooms = io.sockets.adapter.rooms
  return Object.keys(rooms)
    .filter(key => key.startsWith('game-'))
    .map(key => db.games[key])
}

app.get('/games', (req, res) => {
  res.json(getGames())
})

app.get('/games/:id/', (req, res) => {
  const id = req.params.id
  try {
    const game = db.getGame(id)
    res.json(game)
  } catch (err) {
    if (err.code === ERRORS.GAME_404) {
      res.status(404).json({ message: err.message, code: err.code })
    } else {
      res.status(500).json({ message: err.message })
    }
  }
})

// TODO: add global error handler

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
