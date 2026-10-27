-- Fix campaign status to match current date
UPDATE campaigns 
SET status = CASE 
    WHEN ends_on < CURRENT_DATE THEN 'cloturee'
    WHEN starts_on > CURRENT_DATE THEN 'preparee'  
    ELSE status
END
WHERE status <> CASE 
    WHEN ends_on < CURRENT_DATE THEN 'cloturee'
    WHEN starts_on > CURRENT_DATE THEN 'preparee'  
    ELSE status
END;

-- Show what changed
SELECT id, label, starts_on, ends_on, status as before, CURRENT_DATE as today, 
CASE 
    WHEN ends_on < CURRENT_DATE THEN 'cloturee'
    WHEN starts_on > CURRENT_DATE THEN 'preparee'  
    ELSE status
END as after
FROM campaigns
ORDER BY starts_on;

-- Purge dead sessions (expired)
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
SELECT 'Sessions mortes supprimées' AS info;