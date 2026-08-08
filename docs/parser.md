# Parser Strategy

The MS-3 parser must read real exports, model known fields, preserve unknown fields, serialize without silent data loss, and validate round-trip behavior.

The parser is developed independently of the desktop UI. Real exported libraries belong in `fixtures/boss/` when appropriate to share with the project.
