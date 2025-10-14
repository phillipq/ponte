#!/usr/bin/env node

// Detailed Supabase storage test using the same setup as the app
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Detailed Supabase Storage Test...\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 API Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetailed() {
  try {
    console.log('\n1️⃣ Testing basic connection...');
    
    // Test 1: Basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth status:', authError ? '❌ Error: ' + authError.message : '✅ Connected');
    
    // Test 2: List all buckets with detailed info
    console.log('\n2️⃣ Listing all buckets with details...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
      console.log('Error details:', bucketsError);
    } else {
      console.log('✅ Buckets found:', buckets.length);
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
      });
    }
    
    // Test 3: Check specific buckets
    console.log('\n3️⃣ Checking specific buckets...');
    const targetBuckets = ['property-photos', 'documents'];
    
    for (const bucketName of targetBuckets) {
      console.log(`\nChecking ${bucketName}...`);
      
      // Try to list files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (listError) {
        console.log(`❌ ${bucketName}: ${listError.message}`);
        console.log(`   Error code: ${listError.statusCode}`);
        console.log(`   Error status: ${listError.status}`);
      } else {
        console.log(`✅ ${bucketName}: Can access (${files.length} files found)`);
      }
    }
    
    // Test 4: Try to upload a small test file
    console.log('\n4️⃣ Testing file upload...');
    const testContent = 'test content';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload('test-upload.txt', testFile, {
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('   Error code:', uploadError.statusCode);
      console.log('   Error status:', uploadError.status);
      console.log('   Full error:', uploadError);
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // Clean up
      const { error: deleteError } = await supabase.storage
        .from('property-photos')
        .remove(['test-upload.txt']);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test file:', deleteError.message);
      } else {
        console.log('🧹 Test file cleaned up');
      }
    }
    
    // Test 5: Check bucket policies
    console.log('\n5️⃣ Checking bucket access patterns...');
    
    // Try to access bucket info
    const { data: bucketInfo, error: bucketError } = await supabase.storage
      .from('property-photos')
      .list('', { limit: 0 });
    
    if (bucketError) {
      console.log('❌ Cannot access property-photos bucket:', bucketError.message);
      console.log('   This suggests RLS policies are blocking access');
    } else {
      console.log('✅ Can access property-photos bucket');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testDetailed().then(() => {
  console.log('\n🏁 Detailed test complete!');
  console.log('\n💡 If buckets exist but uploads fail, the issue is likely RLS policies.');
  console.log('💡 Check the Supabase dashboard for bucket settings and policies.');
});
