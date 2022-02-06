import { App } from "@tinyhttp/app"
import { logger } from "@tinyhttp/logger"
import { json } from "milliparsec"
import  { promisify } from "util"
import { exec as cb_exec } from "child_process"
import tmp from "tmp"
import fs from "fs"

const exec = promisify(cb_exec)
const app = new App()

const PORT = Number(process.env.PORT) || 3000
console.log(`Serving API on port ${PORT}`)

app
  .use(logger({
    timestamp: { format: "YYYY-MM-DDTHH:mm:ssZ" },
  }))
  .use(json())
  .post("/submit", async (req, res) => {
    if (!req.body || !req.body.source) {
      return res.sendStatus(400)
    }

    const { name: sourceFile } = tmp.fileSync()
    fs.writeFileSync(sourceFile, req.body.source)

    const cmd = `./interpreter ${sourceFile}`
    const result = await exec(cmd)
    fs.rmSync(sourceFile)

    res.send({ result })
  })
  .listen(PORT)
