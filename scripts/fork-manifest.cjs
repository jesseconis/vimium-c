const fs = require("node:fs")
const path = require("node:path")

const manifestPath = path.join(__dirname, "../dist/manifest.json")
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
// Public identity only: not a signing credential. Keep stable across machines/builds.
manifest.key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyBIro1UuRQA2lV1y+00+8GFqiSvuhQz2tkiUAidqFCsJHYX5LGn/29VNyv2JUJ4K25rWkjq06yxDO2L9vgvV8tt0G2wfmzl0iNo8hluW3qUhaj8xxdNmP5oC+yYKfsPG8HIiq1Uspd5trTVdFP6XClByhZT/Qknz2f9OPucgWu9akTH5e1+Z7LMcfGkI7DmbKGk0BIdMMhLA22xjGo7gXpcYaLnuujTwYOOzrQfWSCGhqUCf7whPsJicxP6IVRqrv20QNMO/QnnxmlvtwU0xW6vADE8CYO3SH23Izi5extqtfjJKADtE6lJllLvQ6DYa6AT7atU2hljWx2eCW4Rj3QIDAQAB"
manifest.name = "Vimium C — jesseconis fork"
manifest.short_name = "Vimium C fork"
manifest.version_name = `${manifest.version} (jesseconis clipboard fix)`
delete manifest.update_url
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
console.log("Fork manifest written to " + manifestPath)
