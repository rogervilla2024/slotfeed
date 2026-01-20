-- ============================================
-- SLOTFEED - Tier 1 Streamers Seed Data
-- ============================================

INSERT INTO streamers (
    kick_id, username, display_name, slug,
    country, kick_url, tier, is_active
) VALUES
    -- Tier 1 Priority Streamers
    ('roshtein', 'roshtein', 'Roshtein', 'roshtein',
     'SE', 'https://kick.com/roshtein', 1, true),

    ('trainwreckstv', 'trainwreckstv', 'Trainwreckstv', 'trainwreckstv',
     'US', 'https://kick.com/trainwreckstv', 1, true),

    ('classybeef', 'classybeef', 'ClassyBeef', 'classybeef',
     'MT', 'https://kick.com/classybeef', 1, true),

    ('xposed', 'xposed', 'Xposed', 'xposed',
     'CA', 'https://kick.com/xposed', 1, true),

    ('deuceace', 'deuceace', 'DeuceAce', 'deuceace',
     'AT', 'https://kick.com/deuceace', 1, true),

    ('casinodaddy', 'casinodaddy', 'CasinoDaddy', 'casinodaddy',
     'SE', 'https://kick.com/casinodaddy', 1, true),

    ('maherco', 'maherco', 'Maherco', 'maherco',
     'FR', 'https://kick.com/maherco', 1, true),

    ('fruityslots', 'fruityslots', 'FruitySlots', 'fruityslots',
     'GB', 'https://kick.com/fruityslots', 1, true),

    ('letsgiveitaspin', 'letsgiveitaspin', 'LetsGiveItASpin', 'letsgiveitaspin',
     'SE', 'https://kick.com/letsgiveitaspin', 1, true),

    ('jarttu84', 'jarttu84', 'Jarttu84', 'jarttu84',
     'FI', 'https://kick.com/jarttu84', 1, true),

    ('vondice', 'vondice', 'VonDice', 'vondice',
     'DE', 'https://kick.com/vondice', 1, true),

    ('spintwix', 'spintwix', 'Spintwix', 'spintwix',
     'SE', 'https://kick.com/spintwix', 1, true),

    -- Tier 2 Regular Streamers
    ('chipmonkz', 'chipmonkz', 'Chipmonkz', 'chipmonkz',
     'GB', 'https://kick.com/chipmonkz', 2, true),

    ('slotspinner', 'slotspinner', 'SlotSpinner', 'slotspinner',
     'GB', 'https://kick.com/slotspinner', 2, true),

    ('ayezee', 'ayezee', 'Ayezee', 'ayezee',
     'IE', 'https://kick.com/ayezee', 2, true),

    ('yassuo', 'yassuo', 'Yassuo', 'yassuo',
     'US', 'https://kick.com/yassuo', 2, true),

    ('codyko', 'codyko', 'Cody Ko', 'codyko',
     'US', 'https://kick.com/codyko', 2, true),

    ('adin', 'adin', 'Adin Ross', 'adin',
     'US', 'https://kick.com/adin', 2, true)

ON CONFLICT (slug) DO UPDATE SET
    kick_url = EXCLUDED.kick_url,
    tier = EXCLUDED.tier,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
