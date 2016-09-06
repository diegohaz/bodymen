import test from "tape"
import bodymen from "../src"

test("bodymen", (t) => {
  t.plan(1)
  t.equal(true, bodymen(), "return true")
})
