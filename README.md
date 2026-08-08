# SideStage

SideStage is a community-driven workspace for live musicians.

It helps musicians prepare rigs, manage devices, organize shows, and reduce the friction between programming gear and performing.

The first device target is the Boss MS-3. The architecture is hardware agnostic, with device-specific behavior isolated behind plugins.

## Current release

**Genesis 0.0.1-alpha**

Status: Active development.

This release establishes the project foundation. It does not yet provide a working MS-3 editor.

## Design principles

- Musician first
- Community driven
- Hardware agnostic
- Lossless editing
- Plugin architecture
- Never destroy user data
- Documentation is a feature
- Ship working software

## Roadmap

### Genesis
- [x] Repository bootstrap
- [ ] MS-3 TSL parser
- [ ] Patch explorer
- [ ] Patch inspector
- [ ] Lossless round-trip validation
- [ ] MS-3 editor
- [ ] Setlists and show workflow

### Future
- Nano Cortex integration
- Additional device plugins
- MIDI workflow tools
- Show mode
- Community fixture library

## Development

Requirements: Node.js 22+, pnpm 10+, Git.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Project structure

```text
apps/desktop
packages/core
packages/midi
packages/ms3
packages/project
packages/ui
fixtures/boss
docs
```

## License

MIT
