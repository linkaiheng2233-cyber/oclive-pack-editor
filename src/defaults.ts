/** Minimal valid starter; align with `roles/manifest.template.json` / `settings.template.json` in oclivenewnew. */

/** 简单创作默认人设长文（写入 `core_personality.txt`）。 */
export const DEFAULT_CORE_PERSONALITY_TEXT = `在这里写角色的性格、说话习惯、口癖、与玩家的关系基调。
运行时优先于 manifest 里的一句话简介，用于主对话人设。`

export const DEFAULT_MANIFEST_JSON = `{
  "id": "my_role_id",
  "name": "示例角色",
  "version": "1.0.0",
  "author": "",
  "description": "一句话简介",
  "default_personality": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  "scenes": ["home"],
  "user_relations": {
    "friend": {
      "display_name": "好友",
      "prompt_hint": "你们是好朋友",
      "favor_multiplier": 1.0,
      "initial_favorability": 50
    }
  },
  "default_relation": "friend"
}
`

export const DEFAULT_SETTINGS_JSON = `{
  "schema_version": 1,
  "model": "qwen2.5:7b",
  "evolution": {
    "event_impact_factor": 1.0,
    "ai_analysis_interval": 15,
    "max_change_per_event": 0.05,
    "max_total_change": 0.5
  },
  "identity_binding": "per_scene",
  "memory_config": {
    "scene_weight_multiplier": 1.2,
    "topic_weights": {
      "home": { "日常": 1.0 }
    }
  },
  "interaction_mode": "immersive",
  "remote_presence": { "default_enabled": false },
  "autonomous_scene": { "on_virtual_time": [] },
  "plugin_backends": {
    "memory": "builtin",
    "emotion": "builtin",
    "event": "builtin",
    "prompt": "builtin",
    "llm": "ollama"
  }
}
`
