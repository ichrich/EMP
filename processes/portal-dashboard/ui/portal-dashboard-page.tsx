"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { useAppSelector } from "@/shared/hooks/redux";
import { PortalLayout } from "@/widgets/layout";
import "./portal-dashboard-page.css";

const cards = ["Заголовок", "Заголовок", "Заголовок", "Заголовок"];

function LayoutMockup() {
  return (
    <>
      <section className="mockup__hero">
        <div>
          <h2 className="mockup__title">Заголовок</h2>
          <p className="mockup__description">Описание</p>
        </div>
        <div className="mockup__actions">
          <Button>Кнопка</Button>
          <Button variant="outline">Кнопка</Button>
        </div>
      </section>

      <section className="mockup__grid">
        {cards.map((card, index) => (
          <Card className="mockup-card" key={`${card}-${index}`}>
            <CardContent>
              <div className="mockup-card__label">{card}</div>
              <p className="mockup-card__text">Текст</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mockup__workspace">
        <Card className="mockup-panel mockup-panel--large">
          <CardContent>
            <div className="mockup-panel__header">
              <span>Заголовок</span>
            </div>
            <div className="mockup-panel__body">
              <div className="mockup-panel__placeholder">
                <span>Текст</span>
              </div>
              <div className="mockup-panel__placeholder">
                <span>Текст</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mockup-panel">
          <CardContent>
            <div className="mockup-panel__header">
              <span>Заголовок</span>
            </div>
            <div className="mockup-panel__body">
              <div className="mockup-panel__placeholder">
                <span>Текст</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ProfileMockup() {
  return (
    <>
      <section className="mockup__hero">
        <div>
          <h2 className="mockup__title">Профиль</h2>
          <p className="mockup__description">Описание</p>
        </div>
        <div className="mockup__actions">
          <Button>Кнопка</Button>
        </div>
      </section>

      <section className="mockup__workspace">
        <Card className="mockup-panel">
          <CardContent>
            <div className="mockup-panel__header">
              <span>Заголовок</span>
            </div>
            <div className="mockup-panel__body">
              <div className="mockup-profile-row">
                <span>Текст</span>
                <span>Текст</span>
              </div>
              <div className="mockup-profile-row">
                <span>Текст</span>
                <span>Текст</span>
              </div>
              <div className="mockup-profile-row">
                <span>Текст</span>
                <span>Текст</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mockup-panel">
          <CardContent>
            <div className="mockup-panel__header">
              <span>Заголовок</span>
            </div>
            <p className="mockup-panel__text">Текст</p>
            <Button variant="outline">Кнопка</Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function SettingsMockup() {
  return (
    <>
      <section className="mockup__hero">
        <div>
          <h2 className="mockup__title">Настройки</h2>
          <p className="mockup__description">Описание</p>
        </div>
      </section>

      <section className="mockup__settings">
        {[1, 2, 3].map((item) => (
          <Card className="mockup-panel" key={item}>
            <CardContent>
              <div className="mockup-panel__header">
                <span>Заголовок</span>
                <Button size="sm" variant="outline">
                  Кнопка
                </Button>
              </div>
              <p className="mockup-panel__text">Текст</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

export function PortalDashboardPage() {
  const activeView = useAppSelector((state) => state.portal.activeView);

  return (
    <PortalLayout>
      <div className="mockup">
        {activeView === "profile" ? <ProfileMockup /> : null}
        {activeView === "settings" ? <SettingsMockup /> : null}
        {activeView === "layout" ? <LayoutMockup /> : null}
      </div>
    </PortalLayout>
  );
}
