-- =====================================================
-- SUPABASE INDEX OPTIMIZATION SCRIPT
-- =====================================================
-- This script adds missing indexes on foreign key columns for better performance

-- =====================================================
-- 1. NEXT AUTH TABLES INDEXES
-- =====================================================

-- Account table
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");

-- Session table  
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");

-- =====================================================
-- 2. CORE APPLICATION INDEXES
-- =====================================================

-- Subscription table
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription" ("userId");

-- Property table
CREATE INDEX IF NOT EXISTS "Property_userId_idx" ON "Property" ("userId");
CREATE INDEX IF NOT EXISTS "Property_partnerId_idx" ON "Property" ("partnerId");

-- PropertyAuditTrail table
CREATE INDEX IF NOT EXISTS "PropertyAuditTrail_propertyId_idx" ON "PropertyAuditTrail" ("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyAuditTrail_userId_idx" ON "PropertyAuditTrail" ("userId");

-- PropertyEvaluation table
CREATE INDEX IF NOT EXISTS "PropertyEvaluation_propertyId_idx" ON "PropertyEvaluation" ("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyEvaluation_userId_idx" ON "PropertyEvaluation" ("userId");

-- PropertyEvaluationItem table
CREATE INDEX IF NOT EXISTS "PropertyEvaluationItem_evaluationId_idx" ON "PropertyEvaluationItem" ("evaluationId");

-- Destination table
CREATE INDEX IF NOT EXISTS "Destination_userId_idx" ON "Destination" ("userId");

-- PropertyDistance table
CREATE INDEX IF NOT EXISTS "PropertyDistance_propertyId_idx" ON "PropertyDistance" ("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyDistance_destinationId_idx" ON "PropertyDistance" ("destinationId");

-- Tag table
CREATE INDEX IF NOT EXISTS "Tag_userId_idx" ON "Tag" ("userId");

-- Client table
CREATE INDEX IF NOT EXISTS "Client_userId_idx" ON "Client" ("userId");

-- QuestionnaireSection table
CREATE INDEX IF NOT EXISTS "QuestionnaireSection_userId_idx" ON "QuestionnaireSection" ("userId");

-- QuestionnaireQuestion table
CREATE INDEX IF NOT EXISTS "QuestionnaireQuestion_sectionId_idx" ON "QuestionnaireQuestion" ("sectionId");

-- QuestionnaireResponseSet table
CREATE INDEX IF NOT EXISTS "QuestionnaireResponseSet_clientId_idx" ON "QuestionnaireResponseSet" ("clientId");

-- QuestionnaireResponse table
CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_responseSetId_idx" ON "QuestionnaireResponse" ("responseSetId");
CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_questionId_idx" ON "QuestionnaireResponse" ("questionId");

-- ClientAiAnalysis table
CREATE INDEX IF NOT EXISTS "ClientAiAnalysis_clientId_idx" ON "ClientAiAnalysis" ("clientId");
CREATE INDEX IF NOT EXISTS "ClientAiAnalysis_responseSetId_idx" ON "ClientAiAnalysis" ("responseSetId");

-- QuestionnaireInvite table
CREATE INDEX IF NOT EXISTS "QuestionnaireInvite_clientId_idx" ON "QuestionnaireInvite" ("clientId");
CREATE INDEX IF NOT EXISTS "QuestionnaireInvite_userId_idx" ON "QuestionnaireInvite" ("userId");

-- Tour table
CREATE INDEX IF NOT EXISTS "Tour_userId_idx" ON "Tour" ("userId");

-- PropertyKeyword table
CREATE INDEX IF NOT EXISTS "PropertyKeyword_propertyId_idx" ON "PropertyKeyword" ("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyKeyword_keywordId_idx" ON "PropertyKeyword" ("keywordId");

-- DestinationKeyword table
CREATE INDEX IF NOT EXISTS "DestinationKeyword_destinationId_idx" ON "DestinationKeyword" ("destinationId");
CREATE INDEX IF NOT EXISTS "DestinationKeyword_keywordId_idx" ON "DestinationKeyword" ("keywordId");

-- =====================================================
-- 3. ADDITIONAL PERFORMANCE INDEXES
-- =====================================================

-- Common query patterns
CREATE INDEX IF NOT EXISTS "Property_status_idx" ON "Property" ("status");
CREATE INDEX IF NOT EXISTS "Property_propertyType_idx" ON "Property" ("propertyType");
CREATE INDEX IF NOT EXISTS "Property_createdAt_idx" ON "Property" ("createdAt");

CREATE INDEX IF NOT EXISTS "Destination_category_idx" ON "Destination" ("category");
CREATE INDEX IF NOT EXISTS "Destination_createdAt_idx" ON "Destination" ("createdAt");

CREATE INDEX IF NOT EXISTS "Client_createdAt_idx" ON "Client" ("createdAt");

CREATE INDEX IF NOT EXISTS "Tour_createdAt_idx" ON "Tour" ("createdAt");

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Check all indexes on foreign key columns
SELECT 
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relkind = 'r'
    AND t.relname IN (
        'Account', 'Session', 'User', 'VerificationToken',
        'Subscription', 'Property', 'PropertyAuditTrail', 'PropertyEvaluation',
        'PropertyEvaluationItem', 'Destination', 'PropertyDistance', 'Partner',
        'Tag', 'Client', 'QuestionnaireSection', 'QuestionnaireQuestion',
        'QuestionnaireResponseSet', 'QuestionnaireResponse', 'ClientAiAnalysis',
        'QuestionnaireInvite', 'Tour', 'Keyword', 'PropertyKeyword', 'DestinationKeyword'
    )
ORDER BY t.relname, i.relname;
