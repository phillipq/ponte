#!/usr/bin/env node

// Simple test script to verify Supabase storage connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Storage Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  try {
    console.log('📡 Testing Supabase connection...');
    
    // Test 1: List buckets
    console.log('\n1️⃣ Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Buckets found:', buckets.map(b => b.name));
    
    // Test 2: Check if our buckets exist
    const requiredBuckets = ['property-photos', 'documents'];
    const existingBuckets = buckets.map(b => b.name);
    
    console.log('\n2️⃣ Checking required buckets...');
    for (const bucket of requiredBuckets) {
      if (existingBuckets.includes(bucket)) {
        console.log(`✅ ${bucket} bucket exists`);
      } else {
        console.log(`❌ ${bucket} bucket missing`);
      }
    }
    
    // Test 3: Try to list files in property-photos bucket
    console.log('\n3️⃣ Testing file listing in property-photos...');
    const { data: files, error: filesError } = await supabase.storage
      .from('property-photos')
      .list('properties', { limit: 1 });
    
    if (filesError) {
      console.log('❌ Error listing files:', filesError.message);
      console.log('💡 This might be an RLS policy issue');
    } else {
      console.log('✅ Can list files in property-photos bucket');
    }
    
    // Test 4: Try to upload a test file
    console.log('\n4️⃣ Testing file upload...');
    const testContent = 'This is a test file';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload('test-upload.txt', testFile);
    
    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('💡 This confirms the RLS policy issue');
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // Clean up test file
      await supabase.storage
        .from('property-photos')
        .remove(['test-upload.txt']);
      console.log('🧹 Cleaned up test file');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testStorage().then(() => {
  console.log('\n🏁 Test complete!');
  console.log('\n💡 If uploads are failing, check your RLS policies in the Supabase dashboard.');
});
