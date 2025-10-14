#!/usr/bin/env node

// Test image upload exactly like the app does
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🖼️  Testing Image Upload (Like Your App)...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  try {
    // Create a simple PNG file in memory (like a real image)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF,
      0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testImage = new File([pngData], 'test.png', { type: 'image/png' });
    
    console.log('📤 Uploading test PNG image...');
    console.log('   File name: test.png');
    console.log('   File type: image/png');
    console.log('   File size:', testImage.size, 'bytes');
    
    // Test upload to property-photos bucket (like your app)
    const filePath = `properties/test-property-id/test-image.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(filePath, testImage, {
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('   Error code:', uploadError.statusCode);
      console.log('   Error status:', uploadError.status);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔒 RLS Policy Issue Detected!');
        console.log('   The bucket exists but RLS policies are blocking uploads.');
        console.log('   Solution: Check your RLS policies in Supabase dashboard.');
      } else if (uploadError.message.includes('mime type')) {
        console.log('\n📁 MIME Type Issue Detected!');
        console.log('   The bucket has MIME type restrictions.');
        console.log('   Solution: Check bucket settings for allowed MIME types.');
      }
    } else {
      console.log('✅ Upload successful!');
      console.log('   File path:', uploadData.path);
      console.log('   Full path:', uploadData.fullPath);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);
      
      console.log('   Public URL:', urlData.publicUrl);
      
      // Clean up
      const { error: deleteError } = await supabase.storage
        .from('property-photos')
        .remove([filePath]);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test file:', deleteError.message);
      } else {
        console.log('🧹 Test file cleaned up');
      }
    }
    
    // Test documents bucket too
    console.log('\n📄 Testing documents bucket...');
    
    const testDoc = new File(['test document content'], 'test.pdf', { type: 'application/pdf' });
    
    const { data: docUploadData, error: docUploadError } = await supabase.storage
      .from('documents')
      .upload('properties/test-property-id/test-document.pdf', testDoc, {
        upsert: true
      });
    
    if (docUploadError) {
      console.log('❌ Document upload failed:', docUploadError.message);
    } else {
      console.log('✅ Document upload successful!');
      
      // Clean up
      await supabase.storage
        .from('documents')
        .remove(['properties/test-property-id/test-document.pdf']);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testImageUpload().then(() => {
  console.log('\n🏁 Image upload test complete!');
  console.log('\n💡 If uploads work here but not in your app, check:');
  console.log('   1. Authentication in your app');
  console.log('   2. File path structure');
  console.log('   3. File type detection');
});
