"use client";
import DOMPurify from 'isomorphic-dompurify';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { Container } from "@/components/atoms/Container";
import { ScrollReveal } from "@/components/atoms/ScrollReveal";
import { YouTubeEmbed } from "@/components/atoms/YouTubeEmbed";
import { ShareButtons } from "@/components/molecules/ShareButtons";
import { NewsCard } from "@/components/molecules/NewsCard";
import { useLanguage } from "@/lib/i18n-context";
import { getNewsArticle, getNewsList, type NewsDetail, type NewsItem } from "@/lib/news-api";
import { Calendar, Clock, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, Loader2, Tag } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
    news: "bg-blue-100 text-blue-700",
    interviews: "bg-purple-100 text-purple-700",
    factory_tours: "bg-green-100 text-green-700",
    exhibitions: "bg-amber-100 text-amber-700",
};

export default function NewsDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { t, locale, isRTL } = useLanguage();

    const [article, setArticle] = useState<NewsDetail | null>(null);
    const [related, setRelated] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const BackArrow = isRTL ? ArrowRight : ArrowLeft;
    const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight;

    useEffect(() => {
        const fetchArticle = async () => {
            setLoading(true);
            setError(false);
            try {
                const data = await getNewsArticle(slug);
                setArticle(data);

                // Fetch related articles from same category
                const relatedData = await getNewsList({ category: data.category });
                setRelated(relatedData.data.filter(n => n.slug !== slug).slice(0, 3));
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchArticle();
    }, [slug]);

    if (loading) {
        return (
            <main className={`min-h-screen bg-white ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
                </div>
                <Footer />
            </main>
        );
    }

    if (error || !article) {
        return (
            <main className={`min-h-screen bg-white ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <p className="text-gray-500 text-lg">Article not found</p>
                    <Link href="/media" className="text-green-700 font-bold hover:underline">
                        {t.media.backToMedia}
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    const title = locale === "ar" ? article.title_ar : article.title_en;
    const content = locale === "ar" ? article.content_ar : article.content_en;
    const categoryLabel = t.media.categories[article.category as keyof typeof t.media.categories] || article.category;

    const formattedDate = article.published_at
        ? new Date(article.published_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "";

    const currentUrl = typeof window !== "undefined" ? window.location.href : "";

    return (
        <main className={`min-h-screen bg-white ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
            <Navbar />

            <article className="pt-28 pb-16">
                <Container className="max-w-4xl">
                    {/* Breadcrumbs */}
                    <ScrollReveal>
                        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
                            <Link href="/" className="hover:text-green-700 transition-colors">{t.media.breadcrumbHome}</Link>
                            <BreadcrumbChevron className="w-5 h-5" />
                            <Link href="/media" className="hover:text-green-700 transition-colors">{t.media.breadcrumbMedia}</Link>
                            <BreadcrumbChevron className="w-5 h-5" />
                            <span className="text-gray-600 font-medium truncate max-w-[200px]">{title}</span>
                        </nav>
                    </ScrollReveal>

                    {/* Article Header */}
                    <ScrollReveal>
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-700"}`}>
                                    <Tag className="w-5 h-5 inline-block mr-1" />
                                    {categoryLabel}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                    <Calendar className="w-5 h-5" />
                                    {formattedDate}
                                </span>
                                {article.reading_time && (
                                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                        <Clock className="w-5 h-5" />
                                        {article.reading_time} {t.media.minRead}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                                {title}
                            </h1>
                        </div>
                    </ScrollReveal>

                    {/* Featured Media */}
                    <ScrollReveal className="mb-10">
                        {article.media_type === "youtube" && article.youtube_url ? (
                            <YouTubeEmbed url={article.youtube_url} title={title} />
                        ) : article.featured_image ? (
                            <div className="rounded-2xl overflow-hidden shadow-lg">
                                <img
                                    src={article.featured_image}
                                    alt={title}
                                    className="w-full h-auto object-cover max-h-[500px]"
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-green-800 to-green-950 h-64 md:h-80 flex items-center justify-center">
                                <span className="text-white/20 text-8xl font-black">{title.charAt(0)}</span>
                            </div>
                        )}
                    </ScrollReveal>

                    {/* Article Content */}
                    <ScrollReveal>
                        <div
                            className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-800 prose-a:text-green-700 hover:prose-a:text-green-800 mb-12"
                            style={{ direction: isRTL ? "rtl" : "ltr" }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                        />
                    </ScrollReveal>

                    {/* Share Section */}
                    <ScrollReveal>
                        <div className="border-t border-b border-gray-100 py-6 mb-12">
                            <ShareButtons url={currentUrl} title={title} />
                        </div>
                    </ScrollReveal>

                    {/* Back Button */}
                    <ScrollReveal>
                        <Link
                            href="/media"
                            className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-800 hover:gap-3 transition-all duration-300 mb-16"
                        >
                            <BackArrow className="w-5 h-5" />
                            {t.media.backToMedia}
                        </Link>
                    </ScrollReveal>
                </Container>

                {/* Related Articles */}
                {related.length > 0 && (
                    <section className="bg-gray-50 py-16">
                        <Container>
                            <ScrollReveal>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center">
                                    {t.media.relatedArticles}
                                </h2>
                            </ScrollReveal>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {related.map((item) => (
                                    <ScrollReveal key={item.id}>
                                        <NewsCard item={item} />
                                    </ScrollReveal>
                                ))}
                            </div>
                        </Container>
                    </section>
                )}
            </article>

            <Footer />
        </main>
    );
}
