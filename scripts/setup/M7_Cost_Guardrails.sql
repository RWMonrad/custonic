-- M7: Cost Guardrails - Enhanced Analysis Tracking

-- Add cost tracking columns to analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS char_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS truncated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cost_cents INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_truncated ON analyses(truncated);
CREATE INDEX IF NOT EXISTS idx_analyses_cost ON analyses(cost_cents);

-- Environment variables to enforce (set in .env):
-- AI_MAX_CHUNKS=50
-- AI_MAX_FINDINGS=20  
-- AI_MAX_INPUT_CHARS=200000
-- AI_MAX_TOKENS_PER_ANALYSIS=10000

-- RPC function to validate and record analysis limits
CREATE OR REPLACE FUNCTION validate_analysis_limits(
    p_analysis_id UUID,
    p_chunk_count INTEGER,
    p_char_count INTEGER,
    p_tokens_in INTEGER,
    p_tokens_out INTEGER
) RETURNS TABLE (
    allowed BOOLEAN,
    truncated BOOLEAN,
    message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_max_chunks INTEGER := COALESCE(NULLIF(current_setting('ai.max_chunks', true), '')::INTEGER, 50);
    v_max_chars INTEGER := COALESCE(NULLIF(current_setting('ai.max_input_chars', true), '')::INTEGER, 200000);
    v_max_tokens INTEGER := COALESCE(NULLIF(current_setting('ai.max_tokens_per_analysis', true), '')::INTEGER, 10000);
    v_truncated BOOLEAN := FALSE;
    v_message TEXT := 'Analysis within limits';
BEGIN
    -- Check limits and set truncated flag
    IF p_chunk_count > v_max_chunks THEN
        v_truncated := TRUE;
        v_message := 'Analysis truncated: chunk count exceeded (' || p_chunk_count || ' > ' || v_max_chunks || ')';
    ELSIF p_char_count > v_max_chars THEN
        v_truncated := TRUE;
        v_message := 'Analysis truncated: character count exceeded (' || p_char_count || ' > ' || v_max_chars || ')';
    ELSIF (p_tokens_in + p_tokens_out) > v_max_tokens THEN
        v_truncated := TRUE;
        v_message := 'Analysis truncated: token count exceeded (' || (p_tokens_in + p_tokens_out) || ' > ' || v_max_tokens || ')';
    END IF;
    
    -- Update analysis record with metrics
    UPDATE analyses 
    SET 
        chunk_count = p_chunk_count,
        char_count = p_char_count,
        tokens_in = p_tokens_in,
        tokens_out = p_tokens_out,
        truncated = v_truncated,
        updated_at = NOW()
    WHERE id = p_analysis_id;
    
    RETURN QUERY SELECT 
        TRUE as allowed,  -- Always allow but may truncate
        v_truncated as truncated,
        v_message as message;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION validate_analysis_limits TO authenticated;
