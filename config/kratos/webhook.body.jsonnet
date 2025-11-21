function(ctx) {
  event: ctx.flow.type,
  identity_id: ctx.identity.id,
  traits: ctx.identity.traits,
  state: ctx.identity.state,
  created_at: ctx.identity.created_at,
  updated_at: ctx.identity.updated_at
}
