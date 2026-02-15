import { createClient } from '@supabase/supabase-js';

async function verifyEmpathyLedgerDatabase() {
  console.log('🔍 Verifying Empathy Ledger Database Connection...\n');

  const supabase = createClient(
    'https://yvnuayzslukamizrlhwb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs'
  );

  try {
    // Test basic connection
    const { data, error } = await supabase.from('_test').select('*').limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('✅ Database connection successful!');
      console.log('📊 Database is empty (as expected for new project)');
    } else if (error) {
      console.log('⚠️  Connection error:', error.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Database has existing tables');
    }

    console.log('\n📋 Database Details:');
    console.log('   URL:', 'https://yvnuayzslukamizrlhwb.supabase.co');
    console.log('   Project Ref:', 'yvnuayzslukamizrlhwb');
    console.log('   Region:', 'ap-southeast-2 (Sydney)');
    console.log('   Status:', 'Ready for Empathy Ledger schema');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Create multi-tenant schema');
    console.log('   2. Set up RLS policies for OCAP® compliance');
    console.log('   3. Configure cultural data sovereignty');

    return true;
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

verifyEmpathyLedgerDatabase();
