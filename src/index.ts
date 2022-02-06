import { App } from "@tinyhttp/app"
import { logger } from "@tinyhttp/logger"
import { json } from "milliparsec"
import  { promisify } from "util"
import { exec as cb_exec } from "child_process"
import tmp from "tmp"
import fs from "fs"
import { RunnerApiSubmitRequest, RunnerApiSubmitResponse } from "slam-types"

const exec = promisify(cb_exec)
const app = new App()

const PORT = Number(process.env.PORT) || 3000
console.log(`Serving API on port ${PORT}`)

const interpretFile = async (sourceFile: string) => {
  const cmd = `./interpreter ${sourceFile}`
  try {
    const result = await exec(cmd)
    return result.stdout
  } catch (err) {
    console.error(err)
    return err.stdout // the interpreter only outputs to stdout
  }
}

app
  .use(logger({
    timestamp: { format: "YYYY-MM-DDTHH:mm:ssZ" },
  }))
  .use(json())
  .post(RunnerApiSubmitRequest.path, async (req, res) => {
    const body: RunnerApiSubmitRequest.Body | undefined = req.body
    if (!body || !body.source) {
      return res.sendStatus(400)
    }

    const { name: sourceFile } = tmp.fileSync() as { name: string }
    fs.writeFileSync(sourceFile, body.source)

    const result = await interpretFile(sourceFile)
    fs.rmSync(sourceFile)

    const response: RunnerApiSubmitResponse.Body = { result }
    res.send(response)
  })
  .listen(PORT)
