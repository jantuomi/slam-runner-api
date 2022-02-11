import "newrelic"
import { App } from "@tinyhttp/app"
import { logger } from "@tinyhttp/logger"
import { json } from "milliparsec"
import  { promisify } from "util"
import { exec as cb_exec } from "child_process"
import tmp from "tmp"
import fs from "fs"
import { RunnerApi } from "slam-types"
import { cors } from "@tinyhttp/cors"
import { hrtime } from "process"

const exec = promisify(cb_exec)
const app = new App()

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
console.log(`Serving API on port ${PORT}`)

const TIMEOUT = process.env.TIMEOUT ? Number(process.env.TIMEOUT) : 5000 // ms
const MAX_SRC_LENGTH = process.env.MAX_SRC_LENGTH ? Number(process.env.MAX_SRC_LENGTH) : 4000 // characters

const interpretFile = async (sourceFile: string) => {
  const cmd = `./interpreter ${sourceFile}`
  try {
    const result = await exec(cmd, { timeout: TIMEOUT, killSignal: "SIGKILL" })
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
  .use(cors())
  .use(json())
  .post(RunnerApi.SubmitRequest.path, async (req, res) => {
    const body: RunnerApi.SubmitRequest.Body | undefined = req.body
    if (!body || body.source === undefined || body.source.length > MAX_SRC_LENGTH) {
      return res.sendStatus(400)
    }

    const apiTimeHandle = hrtime()
    const { name: sourceFile } = tmp.fileSync(undefined) as { name: string }
    fs.writeFileSync(sourceFile, body.source)
    const executionTimeHandle = hrtime()
    const result = await interpretFile(sourceFile)
    const executionTime = Math.round(hrtime(executionTimeHandle)[1] / 1000)
    fs.rm(sourceFile, () => void 0)
    const apiTime = Math.round(hrtime(apiTimeHandle)[1] / 1000)

    const response: RunnerApi.SubmitResponse.Body = {
      result,
      executionTime,
      apiTime,
    }
    res.send(response)
  })
  .listen(PORT)
