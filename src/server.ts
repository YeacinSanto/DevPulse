import app from "./app"
import config from "./config/indexConfig"
import { initDB } from "./db/indexDB"


app.listen(config.port, () => {
    initDB()
  console.log(`Example app listening on port ${config.port}`)
})