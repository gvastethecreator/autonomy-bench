CREATE TABLE votes (
  voter_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (voter_id, prompt_id)
);

CREATE INDEX votes_prompt_model ON votes (prompt_id, model_id);
