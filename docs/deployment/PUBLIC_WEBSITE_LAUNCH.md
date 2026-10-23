# Public website launch preparation

The public-only build is now `npm run build:public`, with output in `frontend/dist-public`. `netlify.toml` uses this command and directory. It must not publish `frontend/dist`, which remains the full application build for independent development.

See [the current cleanup and verification report](PREDEPLOYMENT_CLEANUP.md) for exact changes and retained product features. `npm run preview:public` provides a local static review without application API proxying; `npm run verify:public` validates the public artifact.

The prior [controlled-launch report](CONTROLLED_LAUNCH_READINESS.md) remains a historical account. Its older hero/cloud media and full-stack deployment instructions are superseded by the public-only build and cleanup report. Its synthetic testimonial gate is still enforced.

Remote Netlify setup requires account authorisation. No project, repository connection, deployment, DNS cutover or HTTPS certificate has been claimed as completed. The latest instruction requires no automatic commit, push or deployment. Domain activation remains subject to a separately reviewed public deployment and owner approval.
