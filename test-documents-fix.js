#!/usr/bin/env node

// Test different file types for documents bucket
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📄 Testing Documents Bucket MIME Types...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentsBucket() {
  const testFiles = [
    { name: 'test.txt', type: 'text/plain', content: 'Hello World' },
    { name: 'test.csv', type: 'text/csv', content: 'name,age\nJohn,25' },
    { name: 'test.json', type: 'application/json', content: '{"test": true}' },
    { name: 'test.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', content: 'Excel content' },
    { name: 'test.pdf', type: 'application/pdf', content: 'PDF content' },
    { name: 'test.doc', type: 'application/msword', content: 'Word content' }
  ];
  
  for (const testFile of testFiles) {
    console.log(`\n📤 Testing ${testFile.name} (${testFile.type})...`);
    
    const file = new File([testFile.content], testFile.name, { type: testFile.type });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test-${testFile.name}`, file, {
        upsert: true
      });
    
    if (uploadError) {
      console.log(`❌ ${testFile.name}: ${uploadError.message}`);
    } else {
      console.log(`✅ ${testFile.name}: Upload successful!`);
      
      // Clean up
      await supabase.storage
        .from('documents')
        .remove([`test-${testFile.name}`]);
    }
  }
  
  console.log('\n🔧 If PDF still fails, try these solutions:');
  console.log('1. Go to Supabase Dashboard → Storage → documents bucket → Settings');
  console.log('2. Check "Allowed MIME types" is set to */*');
  console.log('3. Save the settings and wait 30 seconds');
  console.log('4. Try again');
  
  console.log('\n💡 Alternative: Try setting specific MIME types:');
  console.log('   - application/pdf');
  console.log('   - application/msword');
  console.log('   - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  console.log('   - text/plain');
  console.log('   - text/csv');
}

testDocumentsBucket().then(() => {
  console.log('\n🏁 Documents test complete!');
});
