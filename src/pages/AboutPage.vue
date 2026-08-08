<template>
  <div class="about-page">
    <!-- 1. Hero -->
    <section class="about-hero">
      <div class="container">
        <h1 class="about-hero__title">About SeeUs</h1>
        <p class="about-hero__subtitle">
          SeeUs is a movie and series tracker built on a simple premise: what
          you watch, and what you think about it, is yours. We are building it
          independently, without advertising or behavioral tracking. This page
          is the long version of that statement — who we are, how the project
          started, what we have shipped so far, and where we are heading next.
        </p>
      </div>
    </section>

    <!-- 2. Our Story -->
    <section class="about-story">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Our Story</h2>
        </div>
        <div class="about-section__body">
          <h3 class="about-story__heading">How the idea started</h3>
          <p>
            We kept losing track. A film watched on a flight, a series a friend
            recommended over dinner, the next episode in a season we never
            finished — scattered across services, notes apps, and memory.
            Existing trackers were either ad-heavy, locked into a single
            platform, or built for everyone and no one. The problem wasn't a
            lack of tools. It was a lack of tools that respected the person
            using them.
          </p>

          <h3 class="about-story__heading">Building independently</h3>
          <p>
            SeeUs is an independent project. It is not backed by a media
            company, an advertising network, or a venture fund. We pay for our
            own infrastructure, set our own roadmap, and answer for our own
            mistakes. That independence is not a marketing position. It is the
            only way we know to keep a product honest — when there is no
            pressure to sell your attention, there is no structural reason to
            compromise on it.
          </p>

          <h3 class="about-story__heading">The first working version</h3>
          <p>
            The first version of SeeUs did one thing: it let you mark a movie or
            series as watched. No ratings, no social graph, no calendar. A
            single list, owned by you, kept on your account. That was enough to
            know the idea was worth building. The
            <router-link to="/">homepage</router-link> now lists what the
            product has grown into since then. We write about the changes as
            they ship on the <router-link to="/blog">blog</router-link>.
          </p>
        </div>
      </div>
    </section>

    <!-- 3. Why SeeUs Exists -->
    <section class="about-why">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Why SeeUs Exists</h2>
          <p class="about-section__subtitle">
            A private movie tracker built around what was missing in the way we
            watch — and remember what we watched.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-why__heading">The problem we kept hitting</h3>
          <p>
            Keeping a meaningful watch history should not be hard. In practice it
            is. A film watched on a flight goes into a notes app. A series a
            friend recommended gets added to a watchlist that nobody revisits.
            The next episode of a season we meant to finish simply disappears,
            because no single place remembers it. Over a year, what we actually
            watched ends up fragmented across services, spreadsheets, and
            memory — and the meaningful record of it, who we watched it with and
            what we thought, is gone.
          </p>

          <h3 class="about-why__heading">What was missing</h3>
          <p>
            What we wanted was straightforward: a unified place to track movies
            and series, a calendar to organise what we planned to watch next,
            social interaction without the noise of an ad-driven feed, and real
            control over our own data. We did not need another app that treated
            watch history as content to surface, or another movie watchlist
            without ads that asked us to trade privacy for convenience. We
            wanted personal movie tracking that stayed personal — a private
            alternative to the movie tracking apps that kept folding ad units
            into the experience.
          </p>

          <h3 class="about-why__heading">The principle we chose</h3>
          <p>
            The principle we settled on is the one we still build against: what
            you record about what you watch should remain under your control.
            SeeUs does not sell personal data. There is no behavioral
            profiling and no cross-site tracking. We do not resell your data to
            third parties. Those are not features we plan to roll back when
            growth pressures change — they are the reason the project exists.
            You can read the full commitments in the
            <router-link to="/about#about-privacy">Privacy & Security</router-link>
            section, and how they shape what we will and will not build.
          </p>
        </div>
      </div>
    </section>

    <!-- 4. Mission -->
    <section class="about-mission">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Mission</h2>
          <p class="about-section__subtitle">
            To give people a private, ad-free place to track the films and series
            they watch — and to build that product in a way that respects the
            people using it more than the incentives around it.
          </p>
        </div>
        <div class="about-section__body">
          <p class="about-mission__statement">
            We build SeeUs so that what someone watches, and what they think
            about it, stays theirs. That mission shapes three commitments we use
            to decide what to build next — and what to leave alone.
          </p>

          <h3 class="about-mission__heading">Build for real usage</h3>
          <p>
            A feature belongs in SeeUs when it solves a real part of tracking
            what you watch — not when it pads a release notes list or moves an
            engagement metric. We would rather ship a smaller product that
            people actually use than a broad one that exists to look complete.
            When a feature is not pulling its weight for real usage, we are
            willing to remove it. For context on where we are heading next, see
            the <router-link to="/about#about-vision">Vision</router-link>
            section.
          </p>

          <h3 class="about-mission__heading">Keep personal data under user control</h3>
          <p>
            Your watch history is personal, and it should stay that way. SeeUs
            does not sell personal data, does not run behavioral profiling, and
            does not place cross-site tracking. That commitment is the same one
            behind the longer list of specifics in the
            <router-link to="/about#about-privacy">Privacy & Security</router-link>
            section, and it informs how we design every account, comment, and
            list feature.
          </p>

          <h3 class="about-mission__heading">Explain what we change and why</h3>
          <p>
            Product decisions are not always obvious from the outside, so when
            we change something that affects how people use SeeUs, we write about
            it. Development updates and the thinking behind product changes live
            on the <router-link to="/blog">Blog</router-link>. We do not claim
            every internal decision is documented publicly — only the ones that
            shape what you see when you use the product.
          </p>
        </div>
      </div>
    </section>

    <!-- 5. Vision -->
    <section class="about-vision" id="about-vision">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Vision</h2>
          <p class="about-section__subtitle">
            Where we want SeeUs to be headed in the long run — and the lines we
            do not intend to cross.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-vision__heading">Where we're heading</h3>
          <p>
            We want SeeUs to become a stable personal record of what someone
            watches, available wherever they watch it. That means an experience
            that holds up across devices, social features that let people share
            their watch history without turning it into a performance, deeper
            calendar and organization tools so the record stays useful as it
            grows, and a product that keeps tracking at its center rather than
            adding noise around it. The direction is toward a longer-lived,
            more private way to keep up with the films and series a person
            actually cares about — see the features on the
            <router-link to="/#features">homepage</router-link> for what is
            there today.
          </p>

          <h3 class="about-vision__heading">What we will not build</h3>
          <p>
            Some directions are off the table on purpose. We are not building an
            advertising network. We are not licensing content or turning SeeUs
            into a streaming service. We do not sell behavioral data, and a
            recommendation engine whose main job is to monetize how people
            behave is not the kind of tracking we want to do. These boundaries
            may be narrower than what an entertainment platform could be — they
            exist so that the personal record SeeUs keeps stays worth trusting.
          </p>

          <h3 class="about-vision__heading">How we'll measure success</h3>
          <p>
            We judge direction by whether people keep using SeeUs over time, not
            by raw activity numbers. That means looking at retention rather than
            daily engagement spikes, at the quality of what people record rather
            than how often they tap, and at whether users can take their data
            with them — voluntary export and real control over their own record
            are part of the goal, not an afterthought. The concrete work toward
            that direction lives in the
            <router-link to="/about#about-roadmap">Development Roadmap</router-link>.
          </p>
        </div>
      </div>
    </section>

    <!-- 6. Technologies -->
    <section class="about-technologies">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Technologies</h2>
          <p class="about-section__subtitle">
            The stack behind SeeUs — chosen for long-term maintainability, a
            small contributor footprint, and a runtime that stays light on the
            device.
          </p>
        </div>
        <div class="about-technologies__grid">
          <div
            v-for="(tech, index) in technologies"
            :key="index"
            class="about-tech-card"
          >
            <h3 class="about-tech-card__name">{{ tech.name }}</h3>
            <p class="about-tech-card__description">{{ tech.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. How SeeUs Works -->
    <section id="about-how" class="about-how">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">How SeeUs Works</h2>
          <p class="about-section__subtitle">
            This section describes what SeeUs does today, based on what is
            actually running. The <router-link to="/#features">feature overview on the homepage</router-link>
            describes what we are working toward; <router-link to="/about#about-technologies">the technologies behind SeeUs</router-link>
            are covered separately.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-how__heading">The five things SeeUs actually does</h3>
          <p>
            We group the current functionality into five areas. Some are shipped,
            others exist only as homepage copy while we build them.
          </p>

          <h3 class="about-how__heading">Discovery</h3>
          <p>
            You can browse a curated grid of popular and top-rated titles on the
            <router-link to="/movies">movies page</router-link> and open any title
            for a detail page with poster, synopsis, genres, year, runtime, and
            an aggregate rating. Discovery today is browse and detail — there is
            no search field, no filters, and no recommendation engine. The
            homepage card calls this "Smart Discovery"; the smart layer is not
            built yet.
          </p>

          <h3 class="about-how__heading">Tracking</h3>
          <p>
            Tracking is the area most often described in our marketing copy and
            least often implemented in the code. There is currently no watchlist,
            no "mark as watched" control, and no viewing-status picker. This is
            the next large piece of work on the roadmap.
          </p>

          <h3 class="about-how__heading">Social</h3>
          <p>
            The only social surface today is the comment thread under
            <router-link to="/blog">blog posts</router-link>: read and write
            comments, reply, and mention other readers. There are no user
            profiles, no follow graph, and no shared watchlists. The homepage
            card describes a "Social Watchlist" with friends; that layer is not
            implemented and is tracked separately from blog comments.
          </p>

          <h3 class="about-how__heading">Calendar</h3>
          <p>
            There is no calendar feature in the repository — no calendar page,
            route, or component. The homepage card describes a "Release Calendar"
            with premiere alerts; that is roadmap language, not a shipped
            capability.
          </p>

          <h3 class="about-how__heading">Ratings</h3>
          <p>
            Movie pages display a single TMDB aggregate score, shown as a star
            rating out of ten with the vote count. There is no user-submitted
            rating system, no review text, and no IMDb, Rotten Tomatoes, or
            Metacritic aggregation, despite the homepage card describing the
            latter.
          </p>

          <h3 class="about-how__heading">The data model in plain language</h3>
          <p>
            Because tracking and user ratings are not yet shipped, the per-user
            data SeeUs stores today is limited to blog comments — identity,
            display name, avatar seed, replies, and mentions. Movie and series
            metadata is read from TMDB via our backend and is not authored by
            you. SeeUs does not host, stream, or store video. We do not provide
            a data export tool today; when tracking ships, the model will
            expand to watched items, watchlist, and personal ratings. Until
            then, we will not claim exportable history.
          </p>

          <h3 class="about-how__heading">What happens when you sign in</h3>
          <p>
            Authentication is handled by Supabase Auth. On the comment surface
            you can sign in with Google or Facebook through Supabase's OAuth, or
            participate anonymously without an account. When you choose
            anonymous, SeeUs generates a local identifier for your browser and
            uses it to attribute your comments on this device. The anonymous and
            OAuth identities are separate providers: signing in with Google or
            Facebook switches your active comment identity, it does not merge
            your previous anonymous comments into that account. The anonymous
            identifier is a value held in your browser, not cryptographically
            bound to a server-side account, so it should not be treated as a
            security boundary. The full discussion belongs in the Privacy &
            Security section further down this page.
          </p>

          <p>
            The movie browse page is the most complete view of SeeUs —
            <router-link to="/movies">browse the live demo</router-link>.
          </p>
        </div>
      </div>
    </section>

    <!-- 8. Development Roadmap -->
    <section id="about-roadmap" class="about-roadmap">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Development Roadmap</h2>
          <p class="about-section__subtitle">
            The roadmap represents our development direction. Planned items
            are intentions, not guarantees. You can
            <router-link to="/#roadmap">view the roadmap on the homepage</router-link>
            for the visual version; this section captures the same stages in
            writing and explains where we are within them.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-roadmap__heading">Where we are</h3>
          <p>
            We are early in the build. The web application is live with movie
            and series metadata browse, blog comments, and authentication. The
            homepage roadmap frames the rest of 2026 around social features,
            mobile, and a recommendation engine, with desktop and integrations
            planned for 2027. The current quarter on the homepage timeline is
            Q2 2026 (Social Features), marked as in-progress.
          </p>

          <h3 class="about-roadmap__heading">What shipped</h3>
          <p>
            <strong>Q1 2026 — Core Platform Launch.</strong> The web
            application shipped, with the movie and series browse pages, detail
            pages, blog comments with anonymous, Google, and Facebook
            identities, and Supabase Auth. The original Q1 description also
            names "basic tracking" and "cross-platform watchlist sync"; the
            codebase does not yet contain a watchlist or tracking surface, so
            only the published half of the Q1 scope has actually shipped.
          </p>

          <h3 class="about-roadmap__heading">What's next</h3>
          <p>
            <strong>Q2 2026 — Social Features</strong> is the current quarter
            and is in-progress: friend lists, shared watchlists, activity
            feeds, and comment threads. Today only blog comments are live; the
            friends and shared-watchlist layer is not. Beyond Q2, the roadmap
            targets <strong>Q3 2026 — Mobile Apps</strong> (native Android
            client with offline mode, widgets, and push notifications) and
            <strong>Q4 2026 — Recommendation Engine</strong> (suggestions
            based on watch history and genre preferences). Two further stages
            appear in the locale data — Q1 2027 Windows Desktop App and Q2 2027
            API & Integrations — but they are not currently rendered on the
            homepage timeline, so we treat them as draft stages rather than
            committed plans.
          </p>

          <h3 class="about-roadmap__heading">What changed since the original plan</h3>
          <p>
            The most material change is that the "basic tracking and
            cross-platform watchlist sync" called out in the Q1 2026 scope did
            not ship. We chose to ship the public-facing browse, detail, blog,
            and auth surfaces first, and we are now building tracking as part
            of the current Q2 work rather than forcing it before the rest of
            Q1. Roadmap priorities can continue to move as development
            progresses; we will update this section when stages change. You
            can follow the ongoing notes for the project on the
            <router-link to="/blog">blog</router-link>.
          </p>

          <p>
            <router-link to="/blog">Follow progress →</router-link>
          </p>
        </div>
      </div>
    </section>

    <!-- 9. Privacy & Security -->
    <section id="about-privacy" class="about-privacy">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Privacy & Security</h2>
          <p class="about-section__subtitle">
            The short version: we do not sell your personal data, we do not run
            behavioral profiling, and we do not place cross-site tracking. The
            longer version — what we actually collect, what we decline to
            collect, and the limitations we are honest about — is below. For
            the legal text, read the
            <router-link to="/privacy-policy">Privacy Policy</router-link> and
            the <router-link to="/cookies-policy">Cookies Policy</router-link>.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-privacy__heading">What we collect</h3>
          <p>
            When you create an account we store your email address and the
            hashed credentials Supabase Auth uses to authenticate you. When you
            sign in with Google or Facebook, the OAuth provider shares the
            identity we need to recognise you on the comment surface — we do not
            pull your contact list or your feed. On the comment surface we
            store your display name, avatar seed, the comment text you write,
            likes, and reports. Movie and series metadata is sourced from TMDb
            through the backend and is not authored by you. We run GA4
            analytics to understand aggregate traffic; the cookies involved are
            described in the
            <router-link to="/cookies-policy">Cookies Policy</router-link>.
          </p>

          <h3 class="about-privacy__heading">What we do not collect</h3>
          <p>
            We do not sell personal data. We do not run behavioral profiling or
            cross-site tracking. We do not host, stream, or store video —
            SeeUs tracks metadata only. We do not place advertising on the site.
            Because tracking and personal ratings are not yet shipped, we do
            not today collect your watch history, your watchlist, or your
            ratings; those data surfaces do not exist in the codebase yet, so
            there is nothing on those categories to collect or share.
          </p>

          <h3 class="about-privacy__heading">How your data is stored</h3>
          <p>
            Account and comment data live in Supabase Postgres, accessed
            through the Supabase JS client over HTTPS. Tables that hold
            user-authored content — blog posts, comments, comment likes, and
            comment reports — are created with their own migration files and
            Row Level Security where applicable; the comment migrations
            explicitly enable RLS and define read and write policies per
            provider. Anonymous comment identity is a UUID generated in your
            browser and stored in localStorage; it is not cryptographically
            bound to a server-side account. Signing in with Google or Facebook
            switches your active comment identity — it does not merge your
            previous anonymous comments into that account.
          </p>

          <h3 class="about-privacy__heading">How you can leave</h3>
          <p>
            You can stop using SeeUs at any time. The Privacy Policy describes
            your rights — access, correction, deletion, portability, opposition,
            and consent revocation — and you can exercise them by emailing
            privacy@watchnext.app. We want to be plain about two gaps: there is
            no self-service "delete my account" button in the repository today,
            and there is no in-product data export tool. Account deletion is
            handled as a manual request via that email, and the export
            capability is one of the things that ships alongside the tracking
            surface on the roadmap — not before.
          </p>

          <h3 class="about-privacy__heading">Known limitations we are honest about</h3>
          <p>
            Three limitations are worth naming directly. First, the anonymous
            comment token is a plaintext UUID in localStorage with no server
            binding — anyone with access to your browser can read it, and a
            cleared store means a new identity. We treat it as a convenience,
            not a security boundary. Second, the Privacy Policy describes
            encryption in transit and at rest as commitments; we can confirm
            HTTPS in transit, but we have not audited Supabase's at-rest
            encryption ourselves, so we will not claim it as a SeeUs
            implementation. Third, we have not wired a self-service account
            deletion or export flow — both are tracked as work items, and we
            will update this section when they ship. If you want to follow the
            discussion as these change, the
            <router-link to="/about#about-community">Community</router-link>
            section explains where we post updates.
          </p>
        </div>
      </div>
    </section>

    <!-- 10. Community -->
    <section id="about-community" class="about-community">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">Community</h2>
          <p class="about-section__subtitle">
            SeeUs is small and honest about it. We do not publish user or
            download counts, and we will not pretend to be a crowded platform
            when we are not. What we do have are real, working channels for
            feedback and interaction — built into the product rather than
            staged for marketing.
          </p>
        </div>
        <div class="about-section__body">
          <h3 class="about-community__heading">How people use SeeUs</h3>
          <p>
            Today the public web app lets you browse movie and series content,
            open detail pages, and read practical guidance on our
            <router-link to="/blog">blog</router-link>. The blog is where we
            post release notes and progress notes, and it is also where the
            comment surface lives. Anyone can comment — anonymously through a
            browser-generated identity, or signed in with Google or Facebook.
            Depending on what is implemented you can edit or delete your own
            comments, and like or report others. Tracking, watchlists, ratings,
            and social features are not shipped yet, so we are not describing
            them here.
          </p>

          <h3 class="about-community__heading">How to reach us</h3>
          <p>
            The primary direct channel is the
            <router-link to="/feedback">feedback form</router-link>. It is a
            single page with category-preset buttons and a form, and it
            accepts everything from bugs and usability problems to
            accessibility issues and security concerns. We read what comes in
            and it directly informs what we build. There is no formal support
            team and no guaranteed response time; if a message needs a reply,
            we send one.
          </p>

          <h3 class="about-community__heading">How to contribute</h3>
          <p>
            At the moment, feedback is the practical contribution path. We
            cannot point to a public repository accepting pull requests yet,
            so we are not claiming an open-source contributor community. If
            you find a bug or have an idea you want to see built, the
            <router-link to="/feedback">feedback form</router-link> is where
            that input currently lands.
          </p>

          <h3 class="about-community__heading">Moderation & reporting</h3>
          <p>
            To keep the comment surface usable we rely on a reporting path
            built into the comment system. Comments can be reported with a
            category — spam, harassment, offensive language, or other — and we
            treat those reports as a safety mechanism. This is not a claim of
            24/7 or automated moderation; it is a simple channel for flagging
            content. Because anonymous identity is a browser-generated token,
            reporting gives us a way to review content even when we cannot tie
            it to a registered account.
          </p>
        </div>
      </div>
    </section>

    <!-- 11. FAQ -->
    <section id="about-faq" class="about-faq">
      <div class="container">
        <div class="about-section__header">
          <h2 class="about-section__title">FAQ</h2>
          <p class="about-section__subtitle">
            Straight answers to the questions we are most often asked. Where
            something overlaps with another page, we keep the answer short and
            link to the detail.
          </p>
        </div>
        <div class="about-faq__items">
          <details class="about-faq__item">
            <summary class="about-faq__question">Is SeeUs free?</summary>
            <p class="about-faq__answer">
              Yes. SeeUs has a free tier that covers the core browsing
              experience. A Premium tier is available at
              <router-link to="/#premium">$9.90 per month</router-link>. We
              do not currently present an annual plan — the Premium page
              renders only a Free and a monthly Premium card.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">Which platforms does SeeUs support?</summary>
            <p class="about-faq__answer">
              The product data currently declares web, Windows, and Android as
              the supported surfaces — you can see the full breakdown on the
              <router-link to="/#platforms">platforms</router-link> section of
              the homepage. Store and download URLs are loaded from
              configuration at runtime rather than hardcoded, and we have not
              published an iOS app yet.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">Can I export my data?</summary>
            <p class="about-faq__answer">
              Not yet. There is no working data-export tool in the product
              today. Export is tracked as a roadmap item, and we will call it
              out here and in the
              <router-link to="/privacy-policy">Privacy Policy</router-link>
              the moment it ships. We have not promised a date.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">Do you sell my data?</summary>
            <p class="about-faq__answer">
              No. We do not sell personal data, we do not build behavioral
              profiles of you, and we do not track you across other sites.
              These commitments are laid out in the
              <router-link to="/privacy-policy">Privacy Policy</router-link>,
              along with our position on resale.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">How do I delete my account?</summary>
            <p class="about-faq__answer">
              To be direct: there is no self-service "delete my account"
              button in the product today. The Privacy Policy describes your
              rights to deletion and a manual path through
              <router-link to="/privacy-policy">our privacy contact</router-link>,
              and that is the current, honest state. A self-service flow is on
              the roadmap.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">Is there a mobile app?</summary>
            <p class="about-faq__answer">
              Not as a native release yet. Android is declared as a supported
              surface in the product data, and the roadmap includes desktop
              and mobile work, but we are not announcing store availability
              that we cannot point to. The
              <router-link to="/#platforms">platforms section</router-link>
              reflects what is real today.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">How do I report a bug or abuse?</summary>
            <p class="about-faq__answer">
              Use the product's <router-link to="/feedback">feedback form</router-link>.
              It accepts bug reports, usability and accessibility issues,
              security concerns, and content-reports for the comment system. We
              read everything that comes through it.
            </p>
          </details>

          <details class="about-faq__item">
            <summary class="about-faq__question">How can I follow SeeUs updates?</summary>
            <p class="about-faq__answer">
              The <router-link to="/blog">blog</router-link> is where we post
              release notes and progress notes. We do not rely on external
              social profiles to announce changes, so the blog is the reliable
              place to keep up.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- 12. Download CTA -->
    <section class="about-cta">
      <div class="container">
        <h2 class="about-cta__title">Try SeeUs</h2>
        <p class="about-cta__subtitle">
          You now know what SeeUs is, how it works, and where it is heading.
          The quickest way to judge it is to open it up and browse for
          yourself.
        </p>
        <div class="about-cta__actions">
          <router-link to="/" class="about-cta__button about-cta__button--primary">
            Open SeeUs
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// SEO enhancements deferred to a dedicated future task.

const technologies = ref<Array<{ name: string; description: string }>>([
  {
    name: 'Vue 3 + TypeScript',
    description:
      'The frontend is authored in Vue 3 with the Composition API and end-to-end TypeScript. Type checking runs as part of the Vite build, so type errors fail the build rather than slipping through to runtime.',
  },
  {
    name: 'Vite',
    description:
      'Vite powers local development and the production build. The dev server keeps iteration fast, and the built bundle is what gets deployed to Vercel.',
  },
  {
    name: 'vue-router',
    description:
      'Client-side routing is handled by vue-router. Most routes are static, and a few dynamic routes (blog posts, admin views) are declared explicitly so they cannot be shadowed by catch-all segments.',
  },
  {
    name: 'vue-i18n',
    description:
      'Interface copy lives in vue-i18n locale files (English, Spanish, Portuguese). The About page itself is authored inline so its long-form copy does not need to round-trip through the locale files.',
  },
  {
    name: '@unhead/vue',
    description:
      'Page <title> and meta tags are managed with @unhead/vue so each route can set document head without fighting the router. This keeps SEO and Open Graph tags consistent across the site.',
  },
  {
    name: 'Supabase (Postgres)',
    description:
      'The backend runs on Supabase as a managed Postgres instance. Auth, the blog, and comment data all sit behind Row Level Security. The frontend talks to Supabase via @supabase/supabase-js; there is no custom API in this repo.',
  },
])

const steps = ref<Array<{ title: string; description: string }>>([])

const roadmap = ref<Array<{ phase: string; title: string; description: string; current?: boolean }>>([])

const faqItems = ref<Array<{ question: string; answer: string }>>([])
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.about-page {
  background: $color-background;
  color: $color-text;
  min-height: 100vh;
}

/* Shared section header */
.about-section__header {
  text-align: center;
  margin-bottom: $space-8;

  .about-section__title {
    font-size: $text-3xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin-bottom: $space-3;
  }

  .about-section__subtitle {
    font-size: $text-lg;
    color: $color-text-muted;
    max-width: 720px;
    margin: 0 auto;
  }
}

.about-section__body {
  max-width: 800px;
  margin: 0 auto;
  font-size: $text-base;
  line-height: $leading-relaxed;
  color: $color-text-secondary;
}

/* 1. Hero */
.about-hero {
  padding: $space-20 0 $space-16;
  background: $gradient-hero;
  color: $color-text;
  text-align: center;

  &__title {
    font-size: $text-4xl;
    font-weight: $weight-extrabold;
    color: $color-text;
    margin-bottom: $space-4;
  }

  &__subtitle {
    font-size: $text-xl;
    color: $color-text;
    opacity: 0.9;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* 2. Our Story */
.about-story {
  padding: $space-16 0;
}

.about-story__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;

  &:first-of-type {
    margin-top: 0;
  }
}

/* 3. Why SeeUs Exists */
.about-why {
  padding: $space-16 0;
  background: $gradient-section;
}

.about-why__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 4. Mission */
.about-mission {
  padding: $space-16 0;

  &__statement {
    font-size: $text-xl;
    font-weight: $weight-medium;
    color: $color-text;
    text-align: center;
    font-style: italic;
  }

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }
}

/* 5. Vision */
.about-vision {
  padding: $space-16 0;
  background: $gradient-section;

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }
}

/* 6. Technologies */
.about-technologies {
  padding: $space-16 0;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: $space-6;
  }
}

.about-tech-card {
  padding: $space-6;
  border-radius: $radius-card;
  background: $gradient-surface;
  border: 1px solid $color-border;
  transition: $transition-card;

  &:hover {
    border-color: $color-border-hover;
  }

  &__name {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__description {
    font-size: $text-sm;
    color: $color-text-secondary;
    line-height: $leading-relaxed;
  }
}

/* 7. How SeeUs Works */
.about-how {
  padding: $space-16 0;
  background: $gradient-section;

  &__heading {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-top: $space-6;
    margin-bottom: $space-2;
  }

  &__steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: $space-6;
  }

  &__step {
    text-align: center;
    padding: $space-6;
  }

  &__step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: $radius-full;
    background: $gradient-btn-primary;
    color: $color-text;
    font-size: $text-xl;
    font-weight: $weight-bold;
    margin-bottom: $space-3;
  }

  &__step-title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__step-description {
    font-size: $text-sm;
    color: $color-text-secondary;
  }
}

.about-how__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 8. Development Roadmap */
.about-roadmap {
  padding: $space-16 0;

  &__timeline {
    display: grid;
    gap: $space-4;
    max-width: 800px;
    margin: 0 auto;
  }

  &__item {
    padding: $space-6;
    border-left: 4px solid $color-border;
    background: $color-surface;

    &--current {
      border-left-color: $color-primary;
    }
  }

  &__phase {
    display: inline-block;
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: $tracking-wider;
    margin-bottom: $space-2;
  }

  &__title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $color-text;
    margin-bottom: $space-2;
  }

  &__description {
    font-size: $text-sm;
    color: $color-text-secondary;
  }
}

.about-roadmap__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 9. Privacy & Security */
.about-privacy {
  padding: $space-16 0;
  background: $gradient-section;
}

.about-privacy__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;
}

/* 10. Community */
.about-community {
  padding: $space-16 0;
}

.about-community__heading {
  font-size: $text-lg;
  font-weight: $weight-semibold;
  color: $color-text;
  margin-top: $space-6;
  margin-bottom: $space-2;

  &:first-of-type {
    margin-top: 0;
  }
}

/* 11. FAQ */
.about-faq {
  padding: $space-16 0;
  background: $gradient-section;

  &__items {
    max-width: 800px;
    margin: 0 auto;
    display: grid;
    gap: $space-3;
  }

  &__item {
    background: $color-background;
    border-radius: $radius-card;
    padding: $space-4 $space-5;
    border: 1px solid $color-border;
    transition: border-color $transition-fast;

    &[open],
    &:hover {
      border-color: $color-border-hover;
    }
  }

  &__question {
    cursor: pointer;
    font-weight: $weight-semibold;
    font-size: $text-base;
    color: $color-text;
  }

  &__answer {
    margin-top: $space-3;
    color: $color-text-secondary;
    line-height: $leading-relaxed;
  }
}

/* 12. Download CTA */
.about-cta {
  padding: $space-20 0;
  background: $gradient-hero;
  color: $color-text;
  text-align: center;

  &__title {
    font-size: $text-3xl;
    font-weight: $weight-bold;
    color: $color-text;
    margin-bottom: $space-3;
  }

  &__subtitle {
    font-size: $text-lg;
    color: $color-text;
    opacity: 0.9;
    margin-bottom: $space-6;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: $space-4;
  }

  &__button {
    display: inline-block;
    padding: $space-3 $space-6;
    border-radius: $radius-button;
    font-weight: $weight-semibold;
    text-decoration: none;
    box-shadow: $shadow-card;
    transition: transform $duration-fast $ease-in-out,
                background-color $duration-fast $ease-in-out,
                border-color $duration-fast $ease-in-out;
    will-change: transform;

    &:hover {
      transform: translateY(-2px);
    }

    &--primary {
      background: $color-surface-light;
      color: $color-text;
      border: 1px solid $color-border;

      &:hover {
        background: $color-surface-hover;
        border-color: $color-primary;
        box-shadow: $shadow-card-hover;
      }
    }
  }
}
</style>
