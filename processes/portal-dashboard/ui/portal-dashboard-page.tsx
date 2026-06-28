import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PortalLayout } from "@/widgets/layout";
import "./portal-dashboard-page.css";

const cards = ["Заголовок", "Заголовок", "Заголовок", "Заголовок"];

export function PortalDashboardPage() {
  return (
    <PortalLayout>
      <div className="mockup">
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
      </div>
    </PortalLayout>
  );
}
