import { PrismaClient } from '@prisma/client';

const localDbUrl = "postgresql://postgres@localhost:5432/elsalam_db";
const remoteDbUrl = "postgresql://neondb_owner:npg_wxM8VQo6NfKS@ep-bold-darkness-aqvwj50a.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

const localPrisma = new PrismaClient({
    datasources: { db: { url: localDbUrl } }
});

const remotePrisma = new PrismaClient({
    datasources: { db: { url: remoteDbUrl } }
});

async function sync() {
    try {
        console.log("Reading local PageContent...");
        const pages = await localPrisma.pageContent.findMany();
        
        console.log("Writing PageContent to remote...");
        for (const page of pages) {
            await remotePrisma.pageContent.upsert({
                where: { pageSlug: page.pageSlug },
                update: { content: page.content },
                create: { pageSlug: page.pageSlug, content: page.content }
            });
            console.log(`Synced page: ${page.pageSlug}`);
        }
        
        console.log("Reading local Products...");
        const products = await localPrisma.product.findMany();
        console.log("Writing Products to remote...");
        for (const p of products) {
            const { id, categoryId, createdAt, updatedAt, ...rest } = p;
            
            // First we need to make sure categories match
            let localCat = null;
            if (categoryId) {
                localCat = await localPrisma.category.findUnique({ where: { id: categoryId } });
            }
            let remoteCat = null;
            if (localCat?.slug) {
                remoteCat = await remotePrisma.category.findUnique({ where: { slug: localCat.slug } });
            }
            
            if (!remoteCat && localCat) {
                remoteCat = await remotePrisma.category.create({
                    data: {
                        name_ar: localCat.name_ar,
                        name_en: localCat.name_en,
                        slug: localCat.slug
                    }
                });
            }

            if (remoteCat) {
                await remotePrisma.product.upsert({
                    where: { slug: p.slug },
                    update: { ...rest, categoryId: remoteCat.id },
                    create: { ...rest, categoryId: remoteCat.id }
                });
                console.log(`Synced product: ${p.slug}`);
            }
        }
        
        console.log("Sync complete!");
    } catch (e) {
        console.error("Error during sync:", e);
    } finally {
        await localPrisma.$disconnect();
        await remotePrisma.$disconnect();
    }
}

sync();
