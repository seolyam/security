## Error Type

Console Error

## Error Message

Error saving to cloud: {}

    at handleSubmit (components/AnalyzerForm.tsx:285:19)

## Code Frame

283 | });
284 | } catch (error) {

> 285 | console.error('Error saving to cloud:', error);

      |                   ^

286 | }
287 | }
288 | } catch (error) {

Next.js version: 16.0.0 (Turbopack)

## Error Type

Console Error

## Error Message

Supabase sender_behavior upsert error: {}

    at upsertBehaviorRemote (lib/services/behaviorService.ts:120:24)

## Code Frame

118 | updated_at: new Date().toISOString()
119 | }, { onConflict: 'id' });

> 120 | if (error) console.error('Supabase sender_behavior upsert error:', error);

      |                        ^

121 | } catch (error) {
122 | console.error('Supabase sender_behavior upsert exception:', error);
123 | }

Next.js version: 16.0.0 (Turbopack)
